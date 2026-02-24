import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 1_500_000;

const IPV4_PRIVATE_RANGES: Array<[number, number]> = [
  [ipToInt("10.0.0.0"), ipToInt("10.255.255.255")],
  [ipToInt("127.0.0.0"), ipToInt("127.255.255.255")],
  [ipToInt("169.254.0.0"), ipToInt("169.254.255.255")],
  [ipToInt("172.16.0.0"), ipToInt("172.31.255.255")],
  [ipToInt("192.168.0.0"), ipToInt("192.168.255.255")],
];

function ipToInt(ip: string) {
  return (
    ip
      .split(".")
      .map((part) => Number(part))
      .reduce((acc, part) => (acc << 8) + part, 0) >>> 0
  );
}

const isPrivateIpv4 = (hostname: string) => {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return false;
  }

  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const value = ipToInt(hostname);
  return IPV4_PRIVATE_RANGES.some(
    ([start, end]) => value >= start && value <= end
  );
};

const isPrivateHost = (hostname: string) => {
  const normalized = hostname.toLowerCase();
  const ipVersion = isIP(normalized);

  if (ipVersion === 4) {
    return isPrivateIpv4(normalized);
  }

  if (ipVersion === 6) {
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80")
    );
  }

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "metadata.google.internal"
  ) {
    return true;
  }

  return isPrivateIpv4(normalized);
};

export const isPublicHttpUrl = async (input: string) => {
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    if (parsed.username || parsed.password) {
      return false;
    }

    if (isPrivateHost(parsed.hostname)) {
      return false;
    }

    const isIpHost =
      isIP(parsed.hostname) !== 0 ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname);
    if (isIpHost) {
      return true;
    }

    const addresses = await lookup(parsed.hostname, {
      all: true,
      verbatim: true,
    });
    return addresses.every((address) => !isPrivateHost(address.address));
  } catch {
    return false;
  }
};

export const fetchWithTimeout = async (input: string, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const readHtmlWithLimit = async (response: Response) => {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_HTML_BYTES) {
    throw new Error("Response body is too large");
  }

  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_HTML_BYTES) {
      reader.cancel();
      throw new Error("Response body is too large");
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(merged);
};
