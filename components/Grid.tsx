"use client";

import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import Cell from "./Cell";
import ContentViewer from "./ContentViewer";
import FormulaBar from "./FormulaBar";

const ROWS = 20;
const COLS = 10;

const getCellKey = (row: number, col: number) => `${row}-${col}`;

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
  const [searchResults, setSearchResults] = useState<{
    [key: string]: SearchResult;
  }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isEditingCell, setIsEditingCell] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleCellChange = useCallback(
    async (row: number, col: number, value: string) => {
      const key = getCellKey(row, col);
      setCells((prev) => ({
        ...prev,
        [key]: { value, isSearchQuery: false },
      }));

      // Check if this is a search query (starts with =SEARCH or =search)
      if (value.toLowerCase().startsWith("=search(") && value.endsWith(")")) {
        const query = value
          .slice(8, -1)
          .trim()
          .replace(/^["']|["']$/g, "");

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
                [contentKey]: {
                  value: `📄 ${data.title}`,
                  isSearchQuery: false,
                },
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
    },
    []
  );

  const handleCellSelect = useCallback((row: number, col: number) => {
    setSelectedCell(getCellKey(row, col));
  }, []);

  const handleEditingChange = useCallback((isEditing: boolean) => {
    setIsEditingCell(isEditing);
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

  const handleFormulaBarChange = useCallback(
    (value: string) => {
      if (selectedCell) {
        const [row, col] = selectedCell.split("-").map(Number);
        handleCellChange(row, col, value);
      }
    },
    [selectedCell, handleCellChange]
  );

  const handleGridKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // Don't handle keyboard shortcuts if a cell is being edited
      if (isEditingCell) return;

      if (!selectedCell) return;

      const [row, col] = selectedCell.split("-").map(Number);
      let newRow = row;
      let newCol = col;
      let handled = false;

      // Arrow key navigation
      if (e.key === "ArrowUp") {
        newRow = Math.max(0, row - 1);
        handled = true;
      } else if (e.key === "ArrowDown") {
        newRow = Math.min(ROWS - 1, row + 1);
        handled = true;
      } else if (e.key === "ArrowLeft") {
        newCol = Math.max(0, col - 1);
        handled = true;
      } else if (e.key === "ArrowRight") {
        newCol = Math.min(COLS - 1, col + 1);
        handled = true;
      }
      // Tab navigation
      else if (e.key === "Tab") {
        if (e.shiftKey) {
          newCol = col > 0 ? col - 1 : col;
        } else {
          newCol = col < COLS - 1 ? col + 1 : col;
        }
        handled = true;
      }
      // Home/End navigation
      else if (e.key === "Home") {
        if (e.ctrlKey || e.metaKey) {
          newRow = 0;
          newCol = 0;
        } else {
          newCol = 0;
        }
        handled = true;
      } else if (e.key === "End") {
        if (e.ctrlKey || e.metaKey) {
          // Find last used cell
          const lastKey = Object.keys(cells)
            .filter((key) => cells[key]?.value)
            .sort((a, b) => {
              const [rowA, colA] = a.split("-").map(Number);
              const [rowB, colB] = b.split("-").map(Number);
              return rowB - rowA || colB - colA;
            })[0];
          if (lastKey) {
            [newRow, newCol] = lastKey.split("-").map(Number);
          } else {
            newRow = ROWS - 1;
            newCol = COLS - 1;
          }
        } else {
          newCol = COLS - 1;
        }
        handled = true;
      }
      // Delete/Backspace to clear cell
      else if (e.key === "Delete" || e.key === "Backspace") {
        const key = getCellKey(row, col);
        setCells((prev) => ({
          ...prev,
          [key]: { value: "", isSearchQuery: false },
        }));
        handled = true;
      }
      // Enter to start editing
      else if (e.key === "Enter" && !e.shiftKey) {
        // Cell component will handle editing, just prevent default
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        if (newRow !== row || newCol !== col) {
          setSelectedCell(getCellKey(newRow, newCol));
        }
      }
    },
    [selectedCell, isEditingCell, cells]
  );

  // Focus grid when mounted
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <FormulaBar
        selectedCell={getSelectedCellLabel()}
        cellValue={selectedCell ? cells[selectedCell]?.value || "" : ""}
        onValueChange={handleFormulaBarChange}
      />
      <div
        ref={gridRef}
        className="flex flex-1 overflow-hidden"
        onKeyDown={handleGridKeyDown}
        tabIndex={0}
      >
        <div className="flex-1 overflow-auto bg-white">
          <div className="inline-block min-w-full">
            {/* Column headers */}
            <div className="flex sticky top-0 bg-[#f8f9fa] z-10 border-t border-l border-gray-300">
              <div className="w-12 min-w-[48px] h-[21px] border-r border-b border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 bg-[#f8f9fa] flex-shrink-0"></div>
              {Array.from({ length: COLS }, (_, col) => (
                <div
                  key={`header-col-${col}`}
                  className="w-[100px] min-w-[100px] h-[21px] border-r border-b border-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 bg-[#f8f9fa] flex-shrink-0"
                >
                  {getColumnLabel(col)}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {Array.from({ length: ROWS }, (_, row) => (
              <div
                key={`grid-row-${row}`}
                className="flex border-l border-gray-300"
              >
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
                      onEditingChange={handleEditingChange}
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
