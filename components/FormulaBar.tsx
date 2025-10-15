"use client";

interface FormulaBarProps {
  selectedCell: string | null;
  cellValue: string;
  onValueChange: (value: string) => void;
}

export default function FormulaBar({ selectedCell, cellValue, onValueChange }: FormulaBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value);
  };

  return (
    <div className="bg-white border-b border-gray-300 flex items-center px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="min-w-[60px] px-3 py-1 border border-gray-300 rounded text-sm font-medium bg-gray-50">
          {selectedCell || ""}
        </div>
        <span className="text-gray-600 text-lg font-light">ƒₓ</span>
      </div>
      <input
        type="text"
        value={cellValue}
        onChange={handleChange}
        placeholder="Enter value or formula"
        className="flex-1 ml-2 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
