"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cell from "./Cell";
import ContentViewer from "./ContentViewer";
import FormulaBar from "./FormulaBar";

const ROWS = 20;
const COLS = 10;

interface CellData {
  value: string;
  isSearchQuery?: boolean;
}

interface SearchResult {
  url: string;
  title: string;
  content: string;
  images: string[];
}

export default function Grid() {
  const [cells, setCells] = useState<{ [key: string]: CellData }>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ [key: string]: SearchResult }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const handleCellChange = useCallback(async (row: number, col: number, value: string) => {
    const key = getCellKey(row, col);
    setCells((prev) => ({
      ...prev,
      [key]: { value, isSearchQuery: false },
    }));

    // Check if this is a search query (starts with =SEARCH or =search)
    if (value.toLowerCase().startsWith("=search(") && value.endsWith(")")) {
      const query = value.slice(8, -1).trim().replace(/^["']|["']$/g, "");
      
      if (query) {
        setCells((prev) => ({
          ...prev,
          [key]: { value, isSearchQuery: true },
        }));

        // Set loading state
        setLoading((prev) => ({ ...prev, [key]: true }));

        try {
          const response = await fetch("/api/search", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
          });

          if (response.ok) {
            const data = await response.json();
            setSearchResults((prev) => ({ ...prev, [key]: data }));
            
            // Update the cell to show the URL
            setCells((prev) => ({
              ...prev,
              [key]: { value: data.url, isSearchQuery: true },
            }));

            // Display content in adjacent cells (to the right and below)
            const contentKey = getCellKey(row, col + 1);
            setCells((prev) => ({
              ...prev,
              [contentKey]: { value: `📄 ${data.title}`, isSearchQuery: false },
            }));
          } else {
            setCells((prev) => ({
              ...prev,
              [key]: { value: "Error: Search failed", isSearchQuery: false },
            }));
          }
        } catch (error) {
          console.error("Search error:", error);
          setCells((prev) => ({
            ...prev,
            [key]: { value: "Error: Search failed", isSearchQuery: false },
          }));
        } finally {
          setLoading((prev) => ({ ...prev, [key]: false }));
        }
      }
    }
  }, []);

  const handleCellSelect = useCallback((row: number, col: number) => {
    setSelectedCell(getCellKey(row, col));
  }, []);

  const getColumnLabel = (col: number) => {
    let label = "";
    let num = col;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  };

  const getSelectedCellLabel = () => {
    if (!selectedCell) return "";
    const [row, col] = selectedCell.split("-").map(Number);
    return `${getColumnLabel(col)}${row + 1}`;
  };

  const handleFormulaBarChange = useCallback((value: string) => {
    if (selectedCell) {
      const [row, col] = selectedCell.split("-").map(Number);
      handleCellChange(row, col, value);
    }
  }, [selectedCell, handleCellChange]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <FormulaBar 
        selectedCell={getSelectedCellLabel()}
        cellValue={selectedCell ? cells[selectedCell]?.value || "" : ""}
        onValueChange={handleFormulaBarChange}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto bg-white">
          <div className="inline-block min-w-full">
            {/* Column headers */}
            <div className="flex sticky top-0 bg-[#f8f9fa] z-10 border-t border-l border-gray-300">
              <div className="w-12 min-w-[48px] h-[21px] border-r border-b border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 bg-[#f8f9fa] flex-shrink-0"></div>
              {Array.from({ length: COLS }, (_, col) => (
                <div
                  key={col}
                  className="w-[100px] min-w-[100px] h-[21px] border-r border-b border-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 bg-[#f8f9fa] flex-shrink-0"
                >
                  {getColumnLabel(col)}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {Array.from({ length: ROWS }, (_, row) => (
              <div key={row} className="flex border-l border-gray-300">
                {/* Row header */}
                <div className="w-12 min-w-[48px] h-[21px] min-h-[21px] border-r border-b border-gray-300 bg-[#f8f9fa] flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                  {row + 1}
                </div>
                {/* Cells */}
                {Array.from({ length: COLS }, (_, col) => {
                  const key = getCellKey(row, col);
                  const cellData = cells[key];
                  const isSelected = selectedCell === key;
                  const isLoading = loading[key];

                  return (
                    <Cell
                      key={key}
                      row={row}
                      col={col}
                      value={cellData?.value || ""}
                      isSelected={isSelected}
                      isLoading={isLoading}
                      isSearchQuery={cellData?.isSearchQuery || false}
                      onChange={handleCellChange}
                      onSelect={handleCellSelect}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Content viewer panel */}
        <ContentViewer
          searchResult={selectedCell ? searchResults[selectedCell] : null}
          isVisible={!!selectedCell && !!searchResults[selectedCell]}
        />
      </div>
    </div>
  );
}
