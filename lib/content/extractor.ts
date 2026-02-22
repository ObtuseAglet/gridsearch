import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import {
  fetchWithTimeout,
  isPublicHttpUrl,
  readHtmlWithLimit,
} from "@/lib/search/http";

interface ExtractedContent {
  content: string;
  images: string[];
}

const MAX_CONTENT_LENGTH = 20_000;
const MAX_IMAGES = 20;

const toAbsoluteUrl = (src: string, baseUrl: string) => {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return null;
  }
};

export async function extractContentFromUrl(
  url: string
): Promise<ExtractedContent> {
  try {
    if (!isPublicHttpUrl(url)) {
      return {
        content: "Blocked unsupported or private URL.",
        images: [],
      };
    }

    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "GridSearchBot/1.0",
      },
    });

    if (!response.ok) {
      return {
        content: `Unable to retrieve content (HTTP ${response.status}).`,
        images: [],
      };
    }

    const contentType =
      response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html")) {
      return {
        content:
          "Unable to extract readable content from this non-HTML resource.",
        images: [],
      };
    }

    const html = await readHtmlWithLimit(response);
    const dom = new JSDOM(html, { url, runScripts: "outside-only" });
    const document = dom.window.document;

    for (const node of document.querySelectorAll(
      "script, style, iframe, noscript"
    )) {
      node.remove();
    }

    const article = new Readability(document).parse();
    const content = article?.textContent?.trim();

    const images = Array.from(document.querySelectorAll("img[src]"))
      .map((img) => toAbsoluteUrl(img.getAttribute("src") ?? "", url))
      .filter((src): src is string => !!src)
      .slice(0, MAX_IMAGES);

    return {
      content:
        content?.slice(0, MAX_CONTENT_LENGTH) || "No readable content found.",
      images: [...new Set(images)],
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Content extraction error:", error);
    }
    return {
      content: "Unable to extract content from the selected result.",
      images: [],
    };
  }
}
