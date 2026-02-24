import { extractContentFromUrl } from "@/lib/content/extractor";
import { fetchWithTimeout } from "@/lib/search/http";
import type { SearchProvider, SearchResult } from "@/lib/search/provider";

interface SearXNGResultItem {
  title?: string;
  url?: string;
}

interface SearXNGResponse {
  results?: SearXNGResultItem[];
}

export class SearxngSearchProvider implements SearchProvider {
  constructor(
    private readonly baseUrl = process.env.SEARXNG_BASE_URL ??
      "http://localhost:8080"
  ) {}

  async search(query: string): Promise<SearchResult> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/search?format=json&q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`SearXNG request failed with ${response.status}`);
    }

    const data = (await response.json()) as SearXNGResponse;
    const firstResult = data.results?.find(
      (result) => result.url && result.title
    );

    if (!firstResult?.url || !firstResult.title) {
      throw new Error("No search results found");
    }

    const extractedContent = await extractContentFromUrl(firstResult.url);

    return {
      url: firstResult.url,
      title: firstResult.title,
      content: extractedContent.content,
      images: extractedContent.images,
    };
  }
}
