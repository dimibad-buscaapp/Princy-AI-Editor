/**
 * Build Princy Code Linux AppImage via upstream VS Code gulp.
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
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

console.log("=== Build Princy Code Linux ===");

execSync("node scripts/patch-code-oss.mjs", { cwd: princyCodeRoot, stdio: "inherit" });

const shell = true;
const npmEnv = {
  ...process.env,
  npm_config_force_process_config: process.platform === "win32" ? "false" : process.env.npm_config_force_process_config
};

if (!existsSync(path.join(vscodeRoot, "node_modules"))) {
  execSync("npm ci", { cwd: vscodeRoot, stdio: "inherit", shell, env: npmEnv });
}

execSync("npm run compile-client", { cwd: vscodeRoot, stdio: "inherit", shell, env: npmEnv });
execSync("npx gulp vscode-linux-x64-min-ci", { cwd: vscodeRoot, stdio: "inherit", shell, env: npmEnv });

mkdirSync(distDir, { recursive: true });

const buildDir = path.join(vscodeRoot, ".build/linux/x64");
if (existsSync(buildDir)) {
  for (const f of readdirSync(buildDir)) {
    if (f.endsWith(".AppImage") || f.endsWith(".appimage")) {
      cpSync(path.join(buildDir, f), path.join(distDir, "Princy-Code.AppImage"));
      console.log(`AppImage: ${path.join(distDir, "Princy-Code.AppImage")}`);
    }
  }
}

console.log("=== Build Linux complete ===");
