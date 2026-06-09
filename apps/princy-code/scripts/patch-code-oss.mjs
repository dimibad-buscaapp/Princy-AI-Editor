/**
 * Patch Code-OSS vendor tree: product.json, built-in extensions, icons, welcome.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const princyCodeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(princyCodeRoot, "../..");
const vscodeRoot = path.join(princyCodeRoot, "vendor/vscode");
const extensionsSrc = path.join(princyCodeRoot, "extensions");
const assetsDir = path.join(princyCodeRoot, "assets");

if (!existsSync(vscodeRoot)) {
  console.error("vendor/vscode not found. Run: npm run princy-code:init-submodule");
  process.exit(1);
}

console.log("=== patch-code-oss ===");

// 0. Windows native addons: Node 24 sets clang=1 in process.config; use MSVC (not ClangCL).
if (process.platform === "win32") {
  const rootNpmrc = path.join(vscodeRoot, ".npmrc");
  const buildNpmrc = path.join(vscodeRoot, "build/.npmrc");
  for (const npmrcPath of [rootNpmrc, buildNpmrc]) {
    if (!existsSync(npmrcPath)) continue;
    let text = readFileSync(npmrcPath, "utf8");
    if (/force_process_config/i.test(text)) {
      text = text.replace(/^force_process_config=.*$/m, 'force_process_config="false"');
    } else {
      text = text.trimEnd() + '\nforce_process_config="false"\n';
    }
    writeFileSync(npmrcPath, text);
    console.log(`patched ${path.relative(vscodeRoot, npmrcPath)} (force_process_config=false)`);
  }
}

// 1. Build & sync extensions
execSync("node scripts/sync-extensions.mjs", { cwd: princyCodeRoot, stdio: "inherit" });

// 2. Merge product.json
const templatePath = path.join(princyCodeRoot, "product.json.template");
const overridesPath = path.join(princyCodeRoot, "config/product.overrides.json");
const productPath = path.join(vscodeRoot, "product.json");

const template = JSON.parse(readFileSync(templatePath, "utf8"));
const overrides = existsSync(overridesPath)
  ? JSON.parse(readFileSync(overridesPath, "utf8"))
  : {};
const existing = existsSync(productPath) ? JSON.parse(readFileSync(productPath, "utf8")) : {};

const appId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const merged = {
  ...existing,
  ...template,
  ...overrides,
  win32AppId: appId,
  win32x64AppId: appId,
  win32arm64AppId: appId,
  win32UserAppId: appId,
  extensionAllowedProposedApi: [
    "princy-ai.princy-assistant",
    "princy-ai.princy-swarm",
    "princy-ai.princy-memory",
    "princy-ai.princy-workspace"
  ]
};

writeFileSync(productPath, JSON.stringify(merged, null, 2));
console.log("patched product.json");

// 3. Copy built-in extensions
const vscodeExtDir = path.join(vscodeRoot, "extensions");
if (!existsSync(extensionsSrc)) {
  console.warn("no extensions/ — run sync-extensions first");
} else {
  for (const name of readdirSync(extensionsSrc)) {
    const src = path.join(extensionsSrc, name);
    const dest = path.join(vscodeExtDir, name);
    if (!existsSync(src)) continue;
    cpSync(src, dest, { recursive: true, force: true });
    console.log(`copied built-in extension: ${name}`);
  }
}

// 4. Icons
mkdirSync(assetsDir, { recursive: true });
const iconSources = [
  path.join(repoRoot, "apps/desktop/assets/icon.ico"),
  path.join(princyCodeRoot, "assets/icon.ico")
];
for (const icon of iconSources) {
  if (existsSync(icon)) {
    const winIcon = path.join(vscodeRoot, "resources/win32/code.ico");
    mkdirSync(path.dirname(winIcon), { recursive: true });
    cpSync(icon, winIcon, { force: true });
    console.log("copied icon.ico");
    break;
  }
}

// 5. Welcome page
const welcomeSrc = path.join(assetsDir, "welcome.html");
if (existsSync(welcomeSrc)) {
  const welcomeDest = path.join(vscodeRoot, "src/vs/workbench/contrib/welcomeGettingStarted/common/media/princy-welcome.html");
  mkdirSync(path.dirname(welcomeDest), { recursive: true });
  cpSync(welcomeSrc, welcomeDest, { force: true });
  console.log("copied welcome.html");
}

console.log("=== patch-code-oss complete ===");
