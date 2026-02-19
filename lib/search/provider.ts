export interface SearchResult {
  url: string;
  title: string;
  content: string;
  images: string[];
}

export interface SearchProvider {
  search(query: string): Promise<SearchResult>;
}
