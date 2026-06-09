/**
 * Build Princy Code Windows installer via upstream VS Code gulp.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const princyCodeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vscodeRoot = path.join(princyCodeRoot, "vendor/vscode");
const distDir = path.join(princyCodeRoot, "dist");

if (!existsSync(vscodeRoot)) {
  console.error("Run npm run princy-code:init-submodule first");
  process.exit(1);
}

console.log("=== Build Princy Code Windows ===");

execSync("node scripts/patch-code-oss.mjs", { cwd: princyCodeRoot, stdio: "inherit" });

const shell = true;
const npmEnv = {
  ...process.env,
  npm_config_force_process_config: "false"
};

if (!existsSync(path.join(vscodeRoot, "node_modules"))) {
  execSync("npm ci", { cwd: vscodeRoot, stdio: "inherit", shell, env: npmEnv });
}

execSync("npm run compile-client", { cwd: vscodeRoot, stdio: "inherit", shell, env: npmEnv });
execSync("npx gulp vscode-win32-x64-min-ci", { cwd: vscodeRoot, stdio: "inherit", shell, env: npmEnv });

mkdirSync(distDir, { recursive: true });

const setupCandidates = [
  path.join(vscodeRoot, ".build/win32-x64/system-setup/VSCodeSetup.exe"),
  path.join(vscodeRoot, ".build/win32-x64/user-setup/VSCodeSetup.exe")
];

let copied = false;
for (const src of setupCandidates) {
  if (existsSync(src)) {
    const dest = path.join(distDir, "Princy-Code-Setup.exe");
    cpSync(src, dest);
    console.log(`Installer: ${dest}`);
    copied = true;
    break;
  }
}

if (!copied) {
  console.error("NSIS installer not found — check .build/win32-x64/");
  process.exit(1);
}

console.log("=== Build Windows complete ===");
