import { extractContentFromUrl } from "@/lib/content/extractor";
import { fetchWithTimeout } from "@/lib/search/http";
import type { SearchProvider, SearchResult } from "@/lib/search/provider";

interface BraveResultItem {
  title?: string;
  url?: string;
  description?: string;
}

interface BraveResponse {
  web?: {
    results?: BraveResultItem[];
  };
}

export class BraveSearchProvider implements SearchProvider {
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
      throw new Error("BRAVE_API_KEY is not configured");
    }
    this.apiKey = apiKey;
  }

  async search(query: string): Promise<SearchResult> {
    const response = await fetchWithTimeout(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": this.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave request failed with ${response.status}`);
    }

    const data = (await response.json()) as BraveResponse;
    const firstResult = data.web?.results?.find(
      (result) => result.url && result.title
    );

    if (!firstResult?.url || !firstResult.title) {
      throw new Error("No search results found");
    }

    const extractedContent = await extractContentFromUrl(firstResult.url);

    return {
      url: firstResult.url,
      title: firstResult.title,
      content:
        extractedContent.content ||
        firstResult.description ||
        "No readable content found.",
      images: extractedContent.images,
    };
  }
}
