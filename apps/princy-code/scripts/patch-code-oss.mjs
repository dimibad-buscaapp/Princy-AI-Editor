/**
 * Placeholder — requires vendor/vscode submodule.
 * Future: copy built VSIX into Code-OSS built-in extensions and patch product.json.
 */
import { existsSync } from "node:fs";

const vscodeRoot = new URL("../../vendor/vscode", import.meta.url).pathname;

if (!existsSync(vscodeRoot)) {
  console.error("vendor/vscode not found. Add Code-OSS submodule before running this script.");
  process.exit(1);
}

console.log("patch-code-oss: not implemented yet — see docs/PRINCY-CODE.md");
