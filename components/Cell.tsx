"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";

interface CellProps {
  row: number;
  col: number;
  value: string;
  isSelected: boolean;
  isLoading: boolean;
  isSearchQuery: boolean;
  onChange: (row: number, col: number, value: string) => void;
  onSelect: (row: number, col: number) => void;
}

export default function Cell({
  row,
  col,
  value,
  isSelected,
  isLoading,
  isSearchQuery,
  onChange,
  onSelect,
}: CellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    onSelect(row, col);
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleCellKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      setIsEditing(false);
      if (editValue !== value) {
        onChange(row, col, editValue);
      }
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      if (editValue !== value) {
        onChange(row, col, editValue);
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  const getCellClassName = () => {
    const base =
      "w-[100px] min-w-[100px] h-[21px] min-h-[21px] border-r border-b border-gray-300 relative bg-white hover:bg-gray-50 flex-shrink-0";
    if (isSelected)
      return `${base} outline outline-2 outline-blue-600 -outline-offset-1 z-10 bg-white`;
    return base;
  };

  return (
    <div
      role="gridcell"
      tabIndex={0}
      className={getCellClassName()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleCellKeyDown}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleInputKeyDown}
          className="w-full h-full px-1.5 py-0.5 text-xs outline-none"
        />
      ) : (
        <div className="w-full h-full px-1.5 py-0.5 text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center">
          {isLoading ? (
            <span className="text-gray-500 italic">Searching...</span>
          ) : (
            <>
              {isSearchQuery && (
                <span className="text-blue-600 mr-1" title="Search result">
                  🔍
                </span>
              )}
              <span
                className={
                  isSearchQuery ? "text-blue-600 underline cursor-pointer" : ""
                }
              >
                {value}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
