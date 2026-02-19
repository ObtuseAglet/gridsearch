import { extractContentFromUrl } from "@/lib/content/extractor";
import type { SearchProvider, SearchResult } from "@/lib/search/provider";

interface DuckTopic {
  FirstURL?: string;
  Text?: string;
}

interface DuckResponse {
  Heading?: string;
  AbstractURL?: string;
  AbstractText?: string;
  RelatedTopics?: DuckTopic[];
}

export class DuckSearchProvider implements SearchProvider {
  async search(query: string): Promise<SearchResult> {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );

    if (!response.ok) {
      throw new Error(`DuckDuckGo request failed with ${response.status}`);
    }

    const data = (await response.json()) as DuckResponse;
    const fallbackTopic = data.RelatedTopics?.find((topic) => topic.FirstURL);
    const url = data.AbstractURL || fallbackTopic?.FirstURL;
    const title = data.Heading || fallbackTopic?.Text || query;

    if (!url) {
      throw new Error("No search results found");
    }

    const extractedContent = await extractContentFromUrl(url);

    return {
      url,
      title,
      content:
        extractedContent.content ||
        data.AbstractText ||
        fallbackTopic?.Text ||
        "No readable content found.",
      images: extractedContent.images,
    };
  }
}
