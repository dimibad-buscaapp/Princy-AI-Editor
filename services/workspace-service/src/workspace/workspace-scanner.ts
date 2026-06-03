import fs from "node:fs/promises";
import path from "node:path";
import { isDeniedPath } from "./workspace-guard.js";

export class WorkspaceScanner {
  async scan(root: string, relative = "") {
    const dir = path.join(root, relative);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const items: Array<{ name: string; path: string; type: "file" | "directory" }> = [];

    for (const entry of entries) {
      const rel = path.join(relative, entry.name);
      if (isDeniedPath(rel)) {
        continue;
      }
      items.push({
        name: entry.name,
        path: rel.replace(/\\/g, "/"),
        type: entry.isDirectory() ? "directory" : "file"
      });
    }
    return items;
  }
}
