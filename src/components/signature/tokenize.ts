const KEYWORDS = new Set([
  "def", "return", "if", "elif", "else", "for", "while", "import", "from",
  "class", "in", "not", "and", "or", "is", "None", "True", "False", "pass",
  "raise", "try", "except", "finally", "with", "as", "lambda", "yield",
  "function", "const", "let", "var", "new", "this", "export", "default",
  "async", "await", "interface", "type", "extends", "implements",
]);

const TOKEN_RE =
  /(#.*$|\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|([+\-*/%=<>!&|^~]+)|([.,:;()[\]{}])|(\s+)/gm;

export interface Token {
  text: string;
  className: string;
}

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, match.index), className: "text-code-plain" });
    }
    const [full, comment, str, num, word, op, punct, ws] = match;
    if (comment) tokens.push({ text: comment, className: "text-code-comment" });
    else if (str) tokens.push({ text: str, className: "text-code-string" });
    else if (num) tokens.push({ text: num, className: "text-code-number" });
    else if (word) {
      const followedByParen = line[match.index + full.length] === "(";
      const className = KEYWORDS.has(word)
        ? "text-code-keyword"
        : followedByParen
          ? "text-code-function font-medium"
          : "text-code-plain";
      tokens.push({ text: word, className });
    } else if (op) tokens.push({ text: op, className: "text-code-operator" });
    else if (punct) tokens.push({ text: punct, className: "text-code-punct" });
    else if (ws) tokens.push({ text: ws, className: "" });
    else tokens.push({ text: full, className: "text-code-plain" });
    lastIndex = match.index + full.length;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), className: "text-code-plain" });
  }
  return tokens;
}
