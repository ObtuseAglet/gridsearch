"use client";

export default function Toolbar() {
  return (
    <div className="bg-white border-b border-gray-300">
      {/* Menu bar */}
      <div className="flex items-center px-3 py-1 text-sm">
        <button className="px-3 py-1 hover:bg-gray-100 rounded">File</button>
        <button className="px-3 py-1 hover:bg-gray-100 rounded">Edit</button>
        <button className="px-3 py-1 hover:bg-gray-100 rounded">View</button>
        <button className="px-3 py-1 hover:bg-gray-100 rounded">Insert</button>
        <button className="px-3 py-1 hover:bg-gray-100 rounded">Format</button>
        <button className="px-3 py-1 hover:bg-gray-100 rounded">Data</button>
        <button className="px-3 py-1 hover:bg-gray-100 rounded">Tools</button>
        <button className="px-3 py-1 hover:bg-gray-100 rounded">Help</button>
      </div>
      
      {/* Toolbar icons */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-gray-200">
        <button className="p-1.5 hover:bg-gray-100 rounded" title="Undo">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded" title="Redo">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button className="p-1.5 hover:bg-gray-100 rounded" title="Print">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <select className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50" title="Font family">
          <option>Arial</option>
          <option>Times New Roman</option>
          <option>Courier New</option>
        </select>
        <select className="px-2 py-1 border border-gray-300 rounded text-sm w-16 hover:bg-gray-50" title="Font size">
          <option>10</option>
          <option>11</option>
          <option>12</option>
          <option>14</option>
          <option>16</option>
        </select>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button className="p-1.5 hover:bg-gray-100 rounded font-bold" title="Bold">B</button>
        <button className="p-1.5 hover:bg-gray-100 rounded italic" title="Italic">I</button>
        <button className="p-1.5 hover:bg-gray-100 rounded underline" title="Underline">U</button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button className="p-1.5 hover:bg-gray-100 rounded" title="Text color">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded" title="Fill color">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343" />
          </svg>
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button className="p-1.5 hover:bg-gray-100 rounded" title="Merge cells">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
