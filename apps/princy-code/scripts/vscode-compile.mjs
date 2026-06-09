/**
 * Install + compile Code-OSS using npm (pinned tag from VSCODE_PIN.md).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const princyCodeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vscodeRoot = path.join(princyCodeRoot, "vendor/vscode");
const pinPath = path.join(princyCodeRoot, "VSCODE_PIN.md");

function readPinnedTag() {
  const content = readFileSync(pinPath, "utf8");
  const match = content.match(/Tag pin\s*\|\s*`([^`]+)`/);
  if (!match) {
    console.error("Could not parse Tag pin from VSCODE_PIN.md");
    process.exit(1);
  }
  return match[1].trim();
}

if (!existsSync(vscodeRoot)) {
  console.error("Run npm run princy-code:init-submodule first");
  process.exit(1);
}

const pinnedTag = readPinnedTag();
const pkg = JSON.parse(readFileSync(path.join(vscodeRoot, "package.json"), "utf8"));
const version = String(pkg.version);

if (version !== pinnedTag) {
  console.error(
    `Wrong vscode version ${version}. Princy Code requires tag ${pinnedTag}.\n` +
      "Delete vendor/vscode and run: npm run princy-code:init-submodule"
  );
  process.exit(1);
}

const shell = true;
const npmEnv = {
  ...process.env,
  // Node 24 is built with Clang; avoid inheriting ClangCL for native addons (tree-sitter).
  npm_config_force_process_config: "false"
};

console.log(`=== Code-OSS compile (vscode ${version}) ===`);

if (!existsSync(path.join(vscodeRoot, "node_modules"))) {
  console.log("Running npm ci (first time — may take 15-30 min)...");
  execSync("npm ci", { cwd: vscodeRoot, stdio: "inherit", shell, env: npmEnv });
}

console.log("Running npm run compile-client (gulp compile, no Copilot)...");
execSync("npm run compile-client", { cwd: vscodeRoot, stdio: "inherit", shell, env: npmEnv });

console.log("=== Compile complete ===");
