// Formula evaluator for GridSearch
// Evaluates parsed AST nodes and resolves cell references

import type { ASTNode } from "./parser";
import { FUNCTIONS, type CellValue } from "./functions";

export interface CellData {
  value: string;
  isSearchQuery?: boolean;
}

export interface CellContext {
  cells: { [key: string]: CellData };
  getCellKey: (row: number, col: number) => string;
}

// Parse cell reference like "A1" to {row: 0, col: 0}
export function parseCellReference(ref: string): { row: number; col: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid cell reference: ${ref}`);
  }

  const colStr = match[1].toUpperCase();
  const rowStr = match[2];

  // Convert column letters to number (A=0, B=1, ..., Z=25, AA=26, etc.)
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
  }
  col -= 1; // Convert to 0-indexed

  const row = Number.parseInt(rowStr, 10) - 1; // Convert to 0-indexed

  return { row, col };
}

// Parse range like "A1:B5" to array of cell references
export function parseRange(range: string): string[] {
  const [start, end] = range.split(":");
  const startPos = parseCellReference(start);
  const endPos = parseCellReference(end);

  const cells: string[] = [];
  for (let row = Math.min(startPos.row, endPos.row); row <= Math.max(startPos.row, endPos.row); row++) {
    for (let col = Math.min(startPos.col, endPos.col); col <= Math.max(startPos.col, endPos.col); col++) {
      cells.push(getCellLabel(row, col));
    }
  }

  return cells;
}

// Convert row/col to cell label (0,0 -> "A1")
function getCellLabel(row: number, col: number): string {
  let label = "";
  let num = col;
  while (num >= 0) {
    label = String.fromCharCode(65 + (num % 26)) + label;
    num = Math.floor(num / 26) - 1;
  }
  return `${label}${row + 1}`;
}

// Get cell value from context
function getCellValue(cellRef: string, context: CellContext, visitedCells: Set<string> = new Set()): CellValue | CellValue[] {
  // Circular reference detection
  if (visitedCells.has(cellRef)) {
    throw new Error(`Circular reference detected: ${cellRef}`);
  }

  const { row, col } = parseCellReference(cellRef);
  const key = context.getCellKey(row, col);
  const cellData = context.cells[key];

  if (!cellData || !cellData.value) {
    return null;
  }

  const value = cellData.value;

  // If the cell contains a formula, evaluate it recursively
  if (value.startsWith("=") && !cellData.isSearchQuery) {
    visitedCells.add(cellRef);
    try {
      // Import parser here to avoid circular dependency
      const { parseFormula } = require("./parser");
      const ast = parseFormula(value);
      const result = evaluate(ast, context, visitedCells);
      return result;
    } catch (error) {
      return `#ERROR: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  // Try to parse as number
  const num = Number.parseFloat(value);
  if (!Number.isNaN(num) && value.trim() === String(num)) {
    return num;
  }

  return value;
}

// Evaluate an AST node
export function evaluate(node: ASTNode, context: CellContext, visitedCells: Set<string> = new Set()): CellValue | CellValue[] {
  switch (node.type) {
    case "number":
      return node.value as number;

    case "string":
      return node.value as string;

    case "cell": {
      const cellRef = node.value as string;
      return getCellValue(cellRef, context, new Set(visitedCells));
    }

    case "range": {
      const range = node.value as string;
      const cellRefs = parseRange(range);
      const results = cellRefs.map((ref) => getCellValue(ref, context, new Set(visitedCells)));
      // Flatten any nested arrays (in case a cell in the range contains an array)
      return results.flat() as CellValue[];
    }

    case "binary": {
      const left = evaluate(node.left!, context, visitedCells);
      const right = evaluate(node.right!, context, visitedCells);

      // Handle array operations (for ranges)
      if (Array.isArray(left) || Array.isArray(right)) {
        throw new Error("Cannot perform binary operations on ranges directly");
      }

      const leftNum = typeof left === "number" ? left : Number.parseFloat(String(left));
      const rightNum = typeof right === "number" ? right : Number.parseFloat(String(right));

      switch (node.operator) {
        case "+":
          return leftNum + rightNum;
        case "-":
          return leftNum - rightNum;
        case "*":
          return leftNum * rightNum;
        case "/":
          return rightNum === 0 ? "#DIV/0!" : leftNum / rightNum;
        case "^":
          return leftNum ** rightNum;
        case "<":
          return leftNum < rightNum;
        case ">":
          return leftNum > rightNum;
        case "<=":
          return leftNum <= rightNum;
        case ">=":
          return leftNum >= rightNum;
        case "==":
          return left === right;
        case "!=":
          return left !== right;
        default:
          throw new Error(`Unknown operator: ${node.operator}`);
      }
    }

    case "unary": {
      const operand = evaluate(node.left!, context, visitedCells);
      const num = typeof operand === "number" ? operand : Number.parseFloat(String(operand));

      switch (node.operator) {
        case "+":
          return num;
        case "-":
          return -num;
        default:
          throw new Error(`Unknown unary operator: ${node.operator}`);
      }
    }

    case "function": {
      const funcName = node.name!.toUpperCase();
      const func = FUNCTIONS[funcName];

      if (!func) {
        throw new Error(`Unknown function: ${funcName}`);
      }

      // Evaluate arguments
      const args = (node.args || []).map((arg) => {
        const result = evaluate(arg, context, visitedCells);
        // Flatten arrays from ranges
        if (Array.isArray(result)) {
          return result;
        }
        return result;
      });

      // Special handling for functions that take ranges
      if (["SUM", "AVERAGE", "COUNT", "MIN", "MAX"].includes(funcName)) {
        // Flatten all array arguments
        const flatArgs = args.flat();
        return func(flatArgs);
      }

      // For other functions, pass arguments as-is
      return func(...args);
    }

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

// Main evaluate function
export function evaluateFormula(formula: string, context: CellContext): CellValue | CellValue[] {
  try {
    const { parseFormula } = require("./parser");
    const ast = parseFormula(formula);
    return evaluate(ast, context);
  } catch (error) {
    return `#ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }
}
