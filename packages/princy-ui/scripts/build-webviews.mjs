import * as esbuild from "esbuild";
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");

const entries = [
  "chat", "swarm", "memory", "workspace", "observability",
  "marketplace", "mcp", "autonomous", "settings", "startup", "patch", "hud"
];

mkdirSync(dist, { recursive: true });

await esbuild.build({
  entryPoints: entries.map((e) => join(root, "src/entries", `${e}.tsx`)),
  outdir: dist,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  jsx: "automatic",
  loader: { ".css": "css" },
  entryNames: "[name]",
  minify: false,
  sourcemap: true,
  logLevel: "info"
});

// Copy bundles to vscode-extension media
const extMedia = join(root, "../../apps/vscode-extension/media/webviews");
mkdirSync(extMedia, { recursive: true });
for (const e of entries) {
  const src = join(dist, `${e}.js`);
  if (existsSync(src)) cpSync(src, join(extMedia, `${e}.js`));
}

console.log(`Built ${entries.length} webview bundles → dist/ and media/webviews/`);
