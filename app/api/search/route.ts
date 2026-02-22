import { isIP } from "node:net";
import { type NextRequest, NextResponse } from "next/server";
import { BraveSearchProvider } from "@/lib/search/brave";
import { DuckSearchProvider } from "@/lib/search/duck";
import type { SearchProvider } from "@/lib/search/provider";
import { SearxngSearchProvider } from "@/lib/search/searxng";

export const runtime = "nodejs";

/**
 * In-memory rate limiting store.
 *
 * NOTE: This works best in single-instance Node.js deployments. In multi-instance
 * or serverless environments, each instance has its own store.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_CLEANUP_THRESHOLD = 1_000;

const providerFactories: Record<string, () => SearchProvider> = {
  searxng: () => new SearxngSearchProvider(),
  brave: () => new BraveSearchProvider(),
  duck: () => new DuckSearchProvider(),
};
const providerInstances = new Map<string, SearchProvider>();
const isValidIp = (value: string) => isIP(value) !== 0;

const getProvider = (): SearchProvider => {
  const providerName = process.env.SEARCH_PROVIDER?.toLowerCase() ?? "duck";
  const providerFactory = providerFactories[providerName];
  if (!providerFactory) {
    throw new Error(
      `Unsupported search provider "${providerName}". Expected "searxng", "brave", or "duck".`
    );
  }

  const existingProvider = providerInstances.get(providerName);
  if (existingProvider) return existingProvider;

  const provider = providerFactory();
  providerInstances.set(providerName, provider);
  return provider;
};

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part !== "");
    if (parts.length > 0) {
      const clientIp = parts[0];
      if (isValidIp(clientIp)) {
        return clientIp;
      }
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && isValidIp(realIp)) {
    return realIp;
  }

  const requestWithIp = request as NextRequest & { ip?: string | null };
  if (requestWithIp.ip && isValidIp(requestWithIp.ip)) {
    return requestWithIp.ip;
  }

  return "unknown";
};

const cleanupExpiredRateLimitEntries = (now: number) => {
  for (const [ip, entry] of rateLimitStore) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(ip);
    }
  }
};

const isRateLimited = (ip: string, limitPerMinute: number) => {
  const now = Date.now();
  if (rateLimitStore.size > RATE_LIMIT_CLEANUP_THRESHOLD) {
    cleanupExpiredRateLimitEntries(now);
  }

  const entry = rateLimitStore.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= limitPerMinute) {
    return true;
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return false;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { query?: unknown };
    const query = typeof payload.query === "string" ? payload.query.trim() : "";

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const rateLimitRpm = Number(process.env.API_RATE_LIMIT_RPM ?? "60");
    if (Number.isFinite(rateLimitRpm) && rateLimitRpm > 0) {
      const ip = getClientIp(request);
      if (isRateLimited(ip, rateLimitRpm)) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    const provider = getProvider();
    const result = await provider.search(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch search results" },
      { status: 500 }
    );
  }
}
