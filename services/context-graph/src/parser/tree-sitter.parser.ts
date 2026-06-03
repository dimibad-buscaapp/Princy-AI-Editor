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

const CLASS_RE = /(?:export\s+)?class\s+(\w+)/g;
const INTERFACE_RE = /(?:export\s+)?interface\s+(\w+)/g;
const FUNCTION_RE = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
const IMPORT_RE = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
const EXPORT_RE = /export\s+(?:default\s+)?(?:class|function|interface|const|type)\s+(\w+)?/g;
const EXTENDS_RE = /class\s+(\w+)\s+extends\s+(\w+)/g;
const IMPLEMENTS_RE = /class\s+(\w+)\s+implements\s+([\w,\s]+)/g;

export class TreeSitterParser {
  async parseFile(filePath: string): Promise<ParsedFile> {
    const content = await fs.readFile(filePath, "utf8");
    const symbols: ParsedSymbol[] = [];
    const imports: string[] = [];
    const exports: string[] = [];

    for (const match of content.matchAll(CLASS_RE)) {
      symbols.push({ type: "class", name: match[1]! });
    }
    for (const match of content.matchAll(INTERFACE_RE)) {
      symbols.push({ type: "interface", name: match[1]! });
    }
    for (const match of content.matchAll(FUNCTION_RE)) {
      symbols.push({ type: "function", name: match[1]! });
    }
    for (const match of content.matchAll(IMPORT_RE)) {
      imports.push(match[1]!);
    }
    for (const match of content.matchAll(EXPORT_RE)) {
      if (match[1]) {
        exports.push(match[1]);
      }
    }

    symbols.push({ type: "file", name: path.basename(filePath) });

    return { path: filePath, symbols, imports, exports };
  }
}

export class RelationshipExtractor {
  extract(parsed: ParsedFile) {
    const edges: Array<{ from: string; to: string; relationship: string }> = [];
    const content = parsed.path;

    for (const imp of parsed.imports) {
      edges.push({ from: parsed.path, to: imp, relationship: "IMPORTS" });
    }
    for (const symbol of parsed.symbols) {
      for (const other of parsed.symbols) {
        if (symbol.name !== other.name && symbol.type === "class" && other.type === "function") {
          edges.push({ from: symbol.name, to: other.name, relationship: "REFERENCES" });
        }
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
      if (match[1] && match[1] !== "if" && match[1] !== "for") {
        edges.push({ from: path.basename(filePath), to: match[1], relationship: "CALLS" });
      }
    }
    return edges;
  }
}
