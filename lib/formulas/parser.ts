// Formula parser for GridSearch
// Parses spreadsheet formulas like =SUM(A1:A10), =IF(A1>5, "Yes", "No"), etc.

export interface Token {
  type: "function" | "cell" | "range" | "string" | "number" | "operator" | "lparen" | "rparen" | "comma";
  value: string;
}

export interface ASTNode {
  type: "function" | "cell" | "range" | "string" | "number" | "binary" | "unary";
  value?: string | number;
  name?: string;
  args?: ASTNode[];
  left?: ASTNode;
  right?: ASTNode;
  operator?: string;
}

// Tokenize a formula string
export function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  // Remove leading = if present
  if (formula.startsWith("=")) {
    formula = formula.slice(1);
  }

  while (i < formula.length) {
    const char = formula[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // String literals
    if (char === '"' || char === "'") {
      const quote = char;
      i++;
      let str = "";
      while (i < formula.length && formula[i] !== quote) {
        if (formula[i] === "\\") {
          i++;
          if (i < formula.length) {
            str += formula[i];
          }
        } else {
          str += formula[i];
        }
        i++;
      }
      i++; // Skip closing quote
      tokens.push({ type: "string", value: str });
      continue;
    }

    // Numbers
    if (/\d/.test(char) || (char === "." && /\d/.test(formula[i + 1] || ""))) {
      let num = "";
      while (i < formula.length && /[\d.]/.test(formula[i])) {
        num += formula[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    // Operators
    if ("+-*/^<>=!&|".includes(char)) {
      let op = char;
      i++;
      // Handle two-character operators
      if (i < formula.length && "=&|".includes(formula[i])) {
        op += formula[i];
        i++;
      }
      tokens.push({ type: "operator", value: op });
      continue;
    }

    // Parentheses
    if (char === "(") {
      tokens.push({ type: "lparen", value: "(" });
      i++;
      continue;
    }
    if (char === ")") {
      tokens.push({ type: "rparen", value: ")" });
      i++;
      continue;
    }

    // Comma
    if (char === ",") {
      tokens.push({ type: "comma", value: "," });
      i++;
      continue;
    }

    // Identifiers (functions or cell references)
    if (/[A-Za-z]/.test(char)) {
      let ident = "";
      while (i < formula.length && /[A-Za-z0-9_]/.test(formula[i])) {
        ident = ident + formula[i];
        i++;
      }

      // Check if it's followed by a colon (range) or parenthesis (function)
      const nextChar = formula[i];

      if (nextChar === "(") {
        tokens.push({ type: "function", value: ident.toUpperCase() });
      } else if (isCellReference(ident)) {
        // Check if it's a range
        if (nextChar === ":") {
          const startCell = ident;
          i++; // Skip colon
          let endCell = "";
          while (i < formula.length && /[A-Za-z0-9]/.test(formula[i])) {
            endCell += formula[i];
            i++;
          }
          tokens.push({ type: "range", value: `${startCell}:${endCell}` });
        } else {
          tokens.push({ type: "cell", value: ident });
        }
      } else {
        // Unknown identifier, treat as function
        tokens.push({ type: "function", value: ident.toUpperCase() });
      }
      continue;
    }

    // Unknown character, skip it
    i++;
  }

  return tokens;
}

// Check if a string is a valid cell reference (e.g., A1, B10, AA100)
function isCellReference(str: string): boolean {
  return /^[A-Z]+\d+$/i.test(str);
}

// Parse tokens into an AST
export function parse(tokens: Token[]): ASTNode {
  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }

  function consume(): Token {
    return tokens[pos++];
  }

  function parseExpression(): ASTNode {
    return parseComparison();
  }

  function parseComparison(): ASTNode {
    let left = parseAddition();

    while (peek() && peek()?.type === "operator" && ["<", ">", "<=", ">=", "==", "!=", "="].includes(peek()?.value || "")) {
      const op = consume().value;
      const right = parseAddition();
      left = {
        type: "binary",
        operator: op === "=" ? "==" : op,
        left,
        right,
      };
    }

    return left;
  }

  function parseAddition(): ASTNode {
    let left = parseMultiplication();

    while (peek() && peek()?.type === "operator" && ["+", "-"].includes(peek()?.value || "")) {
      const op = consume().value;
      const right = parseMultiplication();
      left = {
        type: "binary",
        operator: op,
        left,
        right,
      };
    }

    return left;
  }

  function parseMultiplication(): ASTNode {
    let left = parseExponentiation();

    while (peek() && peek()?.type === "operator" && ["*", "/"].includes(peek()?.value || "")) {
      const op = consume().value;
      const right = parseExponentiation();
      left = {
        type: "binary",
        operator: op,
        left,
        right,
      };
    }

    return left;
  }

  function parseExponentiation(): ASTNode {
    let left = parseUnary();

    while (peek() && peek()?.type === "operator" && peek()?.value === "^") {
      const op = consume().value;
      const right = parseUnary();
      left = {
        type: "binary",
        operator: op,
        left,
        right,
      };
    }

    return left;
  }

  function parseUnary(): ASTNode {
    if (peek() && peek()?.type === "operator" && ["+", "-"].includes(peek()?.value || "")) {
      const op = consume().value;
      const operand = parseUnary();
      return {
        type: "unary",
        operator: op,
        left: operand,
      };
    }

    return parsePrimary();
  }

  function parsePrimary(): ASTNode {
    const token = peek();

    if (!token) {
      throw new Error("Unexpected end of formula");
    }

    // Numbers
    if (token.type === "number") {
      consume();
      return {
        type: "number",
        value: Number.parseFloat(token.value),
      };
    }

    // Strings
    if (token.type === "string") {
      consume();
      return {
        type: "string",
        value: token.value,
      };
    }

    // Cell references
    if (token.type === "cell") {
      consume();
      return {
        type: "cell",
        value: token.value,
      };
    }

    // Cell ranges
    if (token.type === "range") {
      consume();
      return {
        type: "range",
        value: token.value,
      };
    }

    // Functions
    if (token.type === "function") {
      const name = consume().value;
      const args: ASTNode[] = [];

      // Expect opening parenthesis
      if (!peek() || peek()?.type !== "lparen") {
        throw new Error(`Expected '(' after function ${name}`);
      }
      consume(); // Consume '('

      // Parse arguments
      if (peek() && peek()?.type !== "rparen") {
        args.push(parseExpression());

        while (peek() && peek()?.type === "comma") {
          consume(); // Consume comma
          args.push(parseExpression());
        }
      }

      // Expect closing parenthesis
      if (!peek() || peek()?.type !== "rparen") {
        throw new Error(`Expected ')' after function ${name} arguments`);
      }
      consume(); // Consume ')'

      return {
        type: "function",
        name,
        args,
      };
    }

    // Parenthesized expressions
    if (token.type === "lparen") {
      consume(); // Consume '('
      const expr = parseExpression();

      if (!peek() || peek()?.type !== "rparen") {
        throw new Error("Expected ')'");
      }
      consume(); // Consume ')'

      return expr;
    }

    throw new Error(`Unexpected token: ${token.type} (${token.value})`);
  }

  return parseExpression();
}

// Main parse function
export function parseFormula(formula: string): ASTNode {
  const tokens = tokenize(formula);
  return parse(tokens);
}
