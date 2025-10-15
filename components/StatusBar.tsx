"use client";

export default function StatusBar() {
  return (
    <div className="bg-white border-t border-gray-300 flex items-center justify-between px-2 py-1.5">
      <div className="flex items-center gap-1">
        <button className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-t border-b-2 border-green-600 bg-green-50">
          Sheet1
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Add sheet">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Zoom out">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <input 
          type="range" 
          min="50" 
          max="200" 
          defaultValue="100" 
          className="w-24 h-1 accent-blue-600" 
          title="Zoom"
        />
        <button className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Zoom in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <span className="text-xs text-gray-600 min-w-[45px] text-center">100%</span>
      </div>
    </div>
  );
}
