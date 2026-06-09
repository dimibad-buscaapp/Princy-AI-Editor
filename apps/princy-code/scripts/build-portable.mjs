/**
 * Package Princy Code Windows portable zip (post-build).
 * Requires vendor/vscode build output — run after build-win.mjs.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const princyCodeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vscodeRoot = path.join(princyCodeRoot, "vendor/vscode");
const distDir = path.join(princyCodeRoot, "dist");
const staging = path.join(distDir, "portable-staging");

const winDir = path.join(vscodeRoot, ".build/win32-x64/VSCode-win32-x64");

if (!existsSync(winDir)) {
  console.error("Portable build requires Code-OSS win32 output. Run build-win first.");
  process.exit(1);
}

console.log("=== Build Princy Code Portable ===");
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
cpSync(winDir, path.join(staging, "Princy-Code"), { recursive: true });

const zipOut = path.join(distDir, "Princy-Code-Portable.zip");
if (process.platform === "win32") {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${path.join(staging, "Princy-Code")}' -DestinationPath '${zipOut}' -Force"`,
    { stdio: "inherit" }
  );
} else {
  execSync(`cd "${staging}" && zip -r "${zipOut}" Princy-Code`, { stdio: "inherit", shell: true });
}

console.log(`Portable zip: ${zipOut}`);
