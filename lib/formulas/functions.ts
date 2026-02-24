// Spreadsheet formula functions

export type CellValue = string | number | boolean | null;

// Helper to convert cell value to number
function toNumber(value: CellValue): number {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    const num = Number.parseFloat(value);
    return Number.isNaN(num) ? 0 : num;
  }
  return 0;
}

// Helper to check if a value is numeric
function isNumeric(value: CellValue): boolean {
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "string") {
    return value.trim() !== "" && !Number.isNaN(Number.parseFloat(value));
  }
  return false;
}

// SUM function - sum all numbers in a range
export function SUM(values: CellValue[]): number {
  return values.reduce<number>((sum, val) => sum + toNumber(val), 0);
}

// AVERAGE function - average of all numbers in a range
export function AVERAGE(values: CellValue[]): number {
  const numbers = values.filter(isNumeric);
  if (numbers.length === 0) return 0;
  return SUM(numbers) / numbers.length;
}

// COUNT function - count non-empty cells
export function COUNT(values: CellValue[]): number {
  return values.filter((val) => val !== null && val !== "").length;
}

// MIN function - minimum value in a range
export function MIN(values: CellValue[]): number {
  const numbers = values.filter(isNumeric).map(toNumber);
  if (numbers.length === 0) return 0;
  return Math.min(...numbers);
}

// MAX function - maximum value in a range
export function MAX(values: CellValue[]): number {
  const numbers = values.filter(isNumeric).map(toNumber);
  if (numbers.length === 0) return 0;
  return Math.max(...numbers);
}

// CONCAT function - concatenate strings
export function CONCAT(...values: CellValue[]): string {
  return values.map((val) => (val === null ? "" : String(val))).join("");
}

// IF function - conditional
export function IF(condition: boolean, trueValue: CellValue, falseValue: CellValue): CellValue {
  return condition ? trueValue : falseValue;
}

// AND function - logical AND
export function AND(...values: CellValue[]): boolean {
  return values.every((val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val !== 0;
    if (typeof val === "string") return val.toLowerCase() === "true" || val !== "";
    return false;
  });
}

// OR function - logical OR
export function OR(...values: CellValue[]): boolean {
  return values.some((val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val !== 0;
    if (typeof val === "string") return val.toLowerCase() === "true" || val !== "";
    return false;
  });
}

// NOT function - logical NOT
export function NOT(value: CellValue): boolean {
  if (typeof value === "boolean") return !value;
  if (typeof value === "number") return value === 0;
  if (typeof value === "string") return value === "" || value.toLowerCase() === "false";
  return true;
}

// ABS function - absolute value
export function ABS(value: CellValue): number {
  return Math.abs(toNumber(value));
}

// ROUND function - round to specified decimal places
export function ROUND(value: CellValue, decimals: number = 0): number {
  const num = toNumber(value);
  const dec = Math.floor(toNumber(decimals));
  const multiplier = 10 ** dec;
  return Math.round(num * multiplier) / multiplier;
}

// UPPER function - convert to uppercase
export function UPPER(value: CellValue): string {
  return String(value || "").toUpperCase();
}

// LOWER function - convert to lowercase
export function LOWER(value: CellValue): string {
  return String(value || "").toLowerCase();
}

// LEN function - string length
export function LEN(value: CellValue): number {
  return String(value || "").length;
}

// Map of all available functions
export const FUNCTIONS: { [key: string]: (...args: any[]) => any } = {
  SUM,
  AVERAGE,
  COUNT,
  MIN,
  MAX,
  CONCAT,
  IF,
  AND,
  OR,
  NOT,
  ABS,
  ROUND,
  UPPER,
  LOWER,
  LEN,
};
