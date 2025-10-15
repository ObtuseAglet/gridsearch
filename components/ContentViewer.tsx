"use client";

interface SearchResult {
  url: string;
  title: string;
  content: string;
  images: string[];
}

interface ContentViewerProps {
  searchResult: SearchResult | null;
  isVisible: boolean;
}

export default function ContentViewer({ searchResult, isVisible }: ContentViewerProps) {
  if (!isVisible || !searchResult) {
    return null;
  }

  return (
    <div className="w-96 border-l border-gray-300 bg-white overflow-auto shadow-lg">
      <div className="sticky top-0 bg-gray-800 text-white p-4 z-10">
        <h2 className="text-lg font-semibold mb-1">Reader Mode</h2>
        <p className="text-xs text-gray-300">Content preview</p>
      </div>

      <div className="p-6">
        {/* Title */}
        <h1 className="text-2xl font-bold mb-2 text-gray-900">{searchResult.title}</h1>

        {/* URL */}
        <a
          href={searchResult.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline mb-4 block break-all"
        >
          {searchResult.url}
        </a>

        {/* Images */}
        {searchResult.images && searchResult.images.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Images</h3>
            <div className="grid grid-cols-1 gap-4">
              {searchResult.images.slice(0, 5).map((image, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={image}
                    alt={`${searchResult.title} - Image ${idx + 1}`}
                    className="w-full h-auto rounded-lg shadow-md"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-sm max-w-none">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Content</h3>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {searchResult.content}
          </div>
        </div>
      </div>
    </div>
  );
}
