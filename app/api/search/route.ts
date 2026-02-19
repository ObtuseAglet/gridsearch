import { type NextRequest, NextResponse } from "next/server";
import { BraveSearchProvider } from "@/lib/search/brave";
import { DuckSearchProvider } from "@/lib/search/duck";
import type { SearchProvider } from "@/lib/search/provider";
import { SearxngSearchProvider } from "@/lib/search/searxng";

export const runtime = "nodejs";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const getProvider = (): SearchProvider => {
  const providerName = process.env.SEARCH_PROVIDER?.toLowerCase() ?? "duck";

  switch (providerName) {
    case "searxng":
      return new SearxngSearchProvider();
    case "brave":
      return new BraveSearchProvider();
    case "duck":
      return new DuckSearchProvider();
    default:
      throw new Error(
        `Unsupported search provider "${providerName}". Expected "searxng", "brave", or "duck".`
      );
  }
};

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return "unknown";
};

const isRateLimited = (ip: string, limitPerMinute: number) => {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + 60_000 });
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
      { status: 502 }
    );
  }
}
