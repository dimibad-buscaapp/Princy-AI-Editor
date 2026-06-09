/**
 * Sync built Princy extensions into apps/princy-code/extensions/
 */
import { cpSync, existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const princyCodeRoot = path.join(root, "apps/princy-code");
const extensionsDir = path.join(princyCodeRoot, "extensions");

const EXTENSIONS = [
  { name: "princy-assistant", source: "apps/vscode-extension", build: true },
  { name: "princy-swarm", source: "apps/princy-swarm", build: true },
  { name: "princy-memory", source: "apps/princy-memory", build: true },
  { name: "princy-workspace", source: "apps/princy-workspace", build: true }
];

function copyExtension(name, sourceRel, built = true) {
  const src = path.join(root, sourceRel);
  const dest = path.join(extensionsDir, name);
  if (!existsSync(src)) {
    console.warn(`skip ${name}: source not found at ${sourceRel}`);
    return;
  }
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });

  const ignore = new Set(["node_modules", ".git", "*.vsix"]);
  cpSync(src, dest, {
    recursive: true,
    filter: (srcPath) => {
      const base = path.basename(srcPath);
      if (base === "node_modules") return false;
      if (base.endsWith(".vsix")) return false;
      return true;
    }
  });

  // Ensure package.json publisher/id
  const pkgPath = path.join(dest, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    pkg.publisher = "princy-ai";
    pkg.name = name;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  if (built && existsSync(path.join(src, "dist"))) {
    cpSync(path.join(src, "dist"), path.join(dest, "dist"), { recursive: true });
  }
  console.log(`synced ${name} → extensions/${name}`);
}

console.log("=== Sync Princy extensions ===");
mkdirSync(extensionsDir, { recursive: true });

execSync("npm run build -w @princy/extension-shared", { cwd: root, stdio: "inherit" });
execSync("npm run build -w @princy/vscode-api-client", { cwd: root, stdio: "inherit" });

for (const ext of EXTENSIONS) {
  if (ext.build) {
    execSync(`npm run build -w ${ext.name}`, { cwd: root, stdio: "inherit" });
  }
  copyExtension(ext.name, ext.source, ext.build);
}

console.log("=== Sync complete ===");
