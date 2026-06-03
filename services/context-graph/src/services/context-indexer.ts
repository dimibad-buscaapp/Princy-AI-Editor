import fs from "node:fs/promises";
import path from "node:path";
import { isDeniedPath, resolveSafePath } from "@princy/core";
import { eventBus } from "@princy/event-bus";
import { RelationshipExtractor, TreeSitterParser } from "../parser/tree-sitter.parser.js";
import { ContextEdgeRepository, ContextNodeRepository } from "../repositories/context.repository.js";

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

export class ContextIndexer {
  constructor(
    private readonly parser = new TreeSitterParser(),
    private readonly extractor = new RelationshipExtractor(),
    private readonly nodes = new ContextNodeRepository(),
    private readonly edges = new ContextEdgeRepository()
  ) {}

  async indexWorkspace(projectId: string, workspacePath: string) {
    const files = await this.scan(workspacePath);
    let indexed = 0;
    const nodeIdByKey = new Map<string, string>();

    for (const file of files) {
      const safe = resolveSafePath(workspacePath, file);
      const parsed = await this.parser.parseFile(safe);
      const fileNode = await this.nodes.upsertNode({
        projectId,
        type: "file",
        name: path.basename(safe),
        path: safe,
        metadata: { imports: parsed.imports, exports: parsed.exports }
      });
      nodeIdByKey.set(safe, fileNode.id);
      indexed++;

      for (const symbol of parsed.symbols) {
        if (symbol.type === "file") {
          continue;
        }
        const symbolNode = await this.nodes.upsertNode({
          projectId,
          type: symbol.type,
          name: symbol.name,
          path: safe,
          metadata: {}
        });
        nodeIdByKey.set(`${safe}::${symbol.name}`, symbolNode.id);
        await this.edges.upsertEdge({
          sourceId: fileNode.id,
          targetId: symbolNode.id,
          relationship: "REFERENCES"
        });
      }

      const content = await fs.readFile(safe, "utf8");
      const relEdges = [
        ...this.extractor.extract(parsed),
        ...this.extractor.extractFromContent(safe, content)
      ];
      for (const edge of relEdges) {
        const sourceId = nodeIdByKey.get(safe) ?? fileNode.id;
        const targetKey = edge.to.includes("/") ? edge.to : `${safe}::${edge.to}`;
        let targetId = nodeIdByKey.get(targetKey);
        if (!targetId) {
          const targetNode = await this.nodes.upsertNode({
            projectId,
            type: "reference",
            name: edge.to,
            path: safe
          });
          targetId = targetNode.id;
          nodeIdByKey.set(targetKey, targetId);
        }
        await this.edges.upsertEdge({
          sourceId,
          targetId,
          relationship: edge.relationship
        });
      }
    }

    eventBus.publish({ type: "context", name: "index.completed", payload: { projectId, indexed } });
    return { indexed, files: files.length };
  }

  private async scan(root: string, relative = ""): Promise<string[]> {
    const entries = await fs.readdir(path.join(root, relative), { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const rel = path.join(relative, entry.name);
      if (isDeniedPath(rel)) {
        continue;
      }
      if (entry.isDirectory()) {
        files.push(...(await this.scan(root, rel)));
      } else if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(rel);
      }
    }
    return files;
  }
}

export class ContextGraphService {
  constructor(
    private readonly indexer = new ContextIndexer(),
    private readonly nodes = new ContextNodeRepository()
  ) {}

  index(projectId: string, workspacePath: string) {
    return this.indexer.indexWorkspace(projectId, workspacePath);
  }

  search(projectId: string | undefined, query: string) {
    return this.nodes.search(projectId, query);
  }

  file(projectId: string | undefined, filePath: string) {
    return this.nodes.findByPath(projectId, filePath);
  }

  graph(projectId: string | undefined) {
    return this.nodes.listGraph(projectId);
  }
}
