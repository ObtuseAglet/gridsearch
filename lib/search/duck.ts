import { extractContentFromUrl } from "@/lib/content/extractor";
import { fetchWithTimeout } from "@/lib/search/http";
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

// Keep titles compact for the existing reader panel/cell UI.
const TITLE_MAX_LENGTH = 120;

const shortenTitle = (value: string) =>
  value.length > TITLE_MAX_LENGTH ? value.slice(0, TITLE_MAX_LENGTH) : value;

export class DuckSearchProvider implements SearchProvider {
  async search(query: string): Promise<SearchResult> {
    const response = await fetchWithTimeout(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );

    if (!response.ok) {
      throw new Error(`DuckDuckGo request failed with ${response.status}`);
    }

    const data = (await response.json()) as DuckResponse;
    const fallbackTopic = data.RelatedTopics?.find((topic) => topic.FirstURL);
    const url = data.AbstractURL || fallbackTopic?.FirstURL;
    const title = shortenTitle(data.Heading || fallbackTopic?.Text || query);

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
