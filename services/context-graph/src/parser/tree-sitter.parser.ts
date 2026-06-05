import fs from "node:fs/promises";
import path from "node:path";

export type ParsedSymbol = {
  type: string;
  name: string;
  line?: number;
};

export type ParsedFile = {
  path: string;
  symbols: ParsedSymbol[];
  imports: string[];
  exports: string[];
};

const PATTERNS: Array<{ type: string; re: RegExp }> = [
  { type: "class", re: /(?:export\s+)?class\s+(\w+)/g },
  { type: "interface", re: /(?:export\s+)?interface\s+(\w+)/g },
  { type: "type", re: /(?:export\s+)?type\s+(\w+)/g },
  { type: "enum", re: /(?:export\s+)?enum\s+(\w+)/g },
  { type: "function", re: /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g },
  { type: "method", re: /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g },
  { type: "const", re: /(?:export\s+)?const\s+(\w+)\s*=/g },
  { type: "arrow", re: /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/g },
  { type: "prisma_model", re: /model\s+(\w+)\s*\{/g },
  { type: "route", re: /app\.(get|post|put|delete|patch)\s*\(\s*["'`]([^"'`]+)["'`]/g }
];

const IMPORT_RE = /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
const EXPORT_RE = /export\s+(?:default\s+)?(?:class|function|interface|const|type|enum)\s+(\w+)/g;
const EXTENDS_RE = /class\s+(\w+)\s+extends\s+(\w+)/g;
const IMPLEMENTS_RE = /class\s+(\w+)\s+implements\s+([\w,\s]+)/g;

function lineOf(content: string, index: number) {
  return content.slice(0, index).split("\n").length;
}

function collectSymbols(content: string, type: string, re: RegExp): ParsedSymbol[] {
  const out: ParsedSymbol[] = [];
  for (const match of content.matchAll(re)) {
    const name = type === "route" ? match[2]! : match[1]!;
    if (!name || name.length < 2) continue;
    if (type === "method" && ["if", "for", "while", "switch", "catch"].includes(name)) continue;
    out.push({ type, name, line: lineOf(content, match.index ?? 0) });
  }
  return out;
}

export class TreeSitterParser {
  async parseFile(filePath: string): Promise<ParsedFile> {
    const content = await fs.readFile(filePath, "utf8");
    const symbols: ParsedSymbol[] = [];
    const imports: string[] = [];
    const exports: string[] = [];

    for (const { type, re } of PATTERNS) {
      symbols.push(...collectSymbols(content, type, re));
    }

    for (const match of content.matchAll(IMPORT_RE)) {
      imports.push(match[1]!);
    }
    for (const match of content.matchAll(EXPORT_RE)) {
      if (match[1]) exports.push(match[1]);
    }

    symbols.push({ type: "file", name: path.basename(filePath), line: 1 });

    return { path: filePath, symbols, imports, exports };
  }
}

export class RelationshipExtractor {
  extract(parsed: ParsedFile) {
    const edges: Array<{ from: string; to: string; relationship: string }> = [];

    for (const imp of parsed.imports) {
      edges.push({ from: parsed.path, to: imp, relationship: "IMPORTS" });
    }
    for (const symbol of parsed.symbols) {
      if (symbol.type === "route") {
        edges.push({ from: parsed.path, to: symbol.name, relationship: "EXPOSES_API" });
      }
      if (symbol.type === "prisma_model") {
        edges.push({ from: parsed.path, to: symbol.name, relationship: "DB_MODEL" });
      }
    }

    return edges;
  }

  extractFromContent(filePath: string, content: string) {
    const edges: Array<{ from: string; to: string; relationship: string }> = [];
    for (const match of content.matchAll(EXTENDS_RE)) {
      edges.push({ from: match[1]!, to: match[2]!, relationship: "EXTENDS" });
    }
    for (const match of content.matchAll(IMPLEMENTS_RE)) {
      const targets = match[2]!.split(",").map((t) => t.trim());
      for (const target of targets) {
        edges.push({ from: match[1]!, to: target, relationship: "IMPLEMENTS" });
      }
    }
    const callMatches = content.matchAll(/(\w+)\s*\(/g);
    for (const match of callMatches) {
      if (match[1] && !["if", "for", "while", "switch", "catch", "function"].includes(match[1])) {
        edges.push({ from: path.basename(filePath), to: match[1], relationship: "CALLS" });
      }
    }
    return edges;
  }
}
