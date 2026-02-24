"use client";

import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import Cell from "./Cell";
import ContentViewer from "./ContentViewer";
import FormulaBar from "./FormulaBar";
import { evaluateFormula } from "../lib/formulas/evaluator";

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
  const [clipboard, setClipboard] = useState<{ [key: string]: CellData } | null>(null);
  const [clipboardMode, setClipboardMode] = useState<"copy" | "cut" | null>(null);
  const [history, setHistory] = useState<Array<{ [key: string]: CellData }>>([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const addToHistory = useCallback((newCells: { [key: string]: CellData }) => {
    setHistory((prev) => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add new state
      newHistory.push({ ...newCells });
      // Keep history limited to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const handleCellChange = useCallback(
    async (row: number, col: number, value: string) => {
      const key = getCellKey(row, col);

      // Check if this is a formula (starts with =)
      const isFormula = value.startsWith("=");
      const isSearchQuery = isFormula && value.toLowerCase().startsWith("=search(") && value.endsWith(")");

      // Store the raw value first
      const newCells = {
        ...cells,
        [key]: { value, isSearchQuery },
      };
      setCells(newCells);
      addToHistory(newCells);

      // If it's a search query, handle it separately
      if (isSearchQuery) {
        const query = value
          .slice(8, -1)
          .trim()
          .replace(/^["']|["']$/g, "");

        if (query) {
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
      // If it's a formula (but not SEARCH), evaluate it
      else if (isFormula) {
        try {
          const context = { cells: newCells, getCellKey };
          const result = evaluateFormula(value, context);

          // Update the cell with the evaluated result (but keep the formula as the value)
          // We'll display the result in the cell, but keep the formula for editing
          const displayValue = result === null ? "" : String(result);

          // Store both the formula and the computed value
          setCells((prev) => ({
            ...prev,
            [key]: {
              value, // Keep original formula
              isSearchQuery: false,
            },
          }));
        } catch (error) {
          console.error("Formula evaluation error:", error);
        }
      }
    },
    [cells, addToHistory]
  );

  const handleCellSelect = useCallback((row: number, col: number) => {
    setSelectedCell(getCellKey(row, col));
  }, []);

  const handleEditingChange = useCallback((isEditing: boolean) => {
    setIsEditingCell(isEditing);
  }, []);

  // Get display value for a cell (evaluates formulas)
  const getCellDisplayValue = useCallback(
    (key: string): string => {
      const cellData = cells[key];
      if (!cellData || !cellData.value) return "";

      const value = cellData.value;

      // If it's a search query, show the value as-is (URL)
      if (cellData.isSearchQuery) return value;

      // If it's a formula (but not SEARCH), evaluate and display result
      if (value.startsWith("=") && !value.toLowerCase().startsWith("=search(")) {
        try {
          const context = { cells, getCellKey };
          const result = evaluateFormula(value, context);
          // Handle arrays (shouldn't happen in cell display but just in case)
          if (Array.isArray(result)) {
            return result.join(", ");
          }
          return result === null ? "" : String(result);
        } catch (error) {
          return value; // Fallback to showing the formula
        }
      }

      // Otherwise, show the raw value
      return value;
    },
    [cells]
  );

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
        const newCells = {
          ...cells,
          [key]: { value: "", isSearchQuery: false },
        };
        setCells(newCells);
        addToHistory(newCells);
        handled = true;
      }
      // Clipboard operations
      else if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        // Copy
        const key = getCellKey(row, col);
        const cellData = cells[key];
        if (cellData) {
          setClipboard({ [key]: cellData });
          setClipboardMode("copy");
        }
        handled = true;
      } else if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        // Cut
        const key = getCellKey(row, col);
        const cellData = cells[key];
        if (cellData) {
          setClipboard({ [key]: cellData });
          setClipboardMode("cut");
          const newCells = {
            ...cells,
            [key]: { value: "", isSearchQuery: false },
          };
          setCells(newCells);
          addToHistory(newCells);
        }
        handled = true;
      } else if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        // Paste
        if (clipboard) {
          const clipboardKeys = Object.keys(clipboard);
          if (clipboardKeys.length === 1) {
            const key = getCellKey(row, col);
            const sourceKey = clipboardKeys[0];
            const newCells = {
              ...cells,
              [key]: { ...clipboard[sourceKey] },
            };
            setCells(newCells);
            addToHistory(newCells);

            // If it was a cut operation, clear the clipboard
            if (clipboardMode === "cut") {
              setClipboard(null);
              setClipboardMode(null);
            }
          }
        }
        handled = true;
      }
      // Undo/Redo
      else if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        // Undo
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCells(history[newIndex]);
        }
        handled = true;
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        // Redo
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setCells(history[newIndex]);
        }
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
    [selectedCell, isEditingCell, cells, clipboard, clipboardMode, history, historyIndex, addToHistory]
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
                  const displayValue = getCellDisplayValue(key);
                  const rawValue = cellData?.value || "";

                  return (
                    <Cell
                      key={key}
                      row={row}
                      col={col}
                      value={displayValue}
                      rawValue={rawValue}
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
