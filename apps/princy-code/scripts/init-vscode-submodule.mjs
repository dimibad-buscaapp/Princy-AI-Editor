/**
 * Initialize microsoft/vscode at pinned tag (not main).
 * Reads tag from VSCODE_PIN.md — shallow clone by tag.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const princyCodeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(princyCodeRoot, "../..");
const vscodeRoot = path.join(princyCodeRoot, "vendor/vscode");
const pinPath = path.join(princyCodeRoot, "VSCODE_PIN.md");

const VSCODE_REPO = "https://github.com/microsoft/vscode.git";

function readPinnedTag() {
  if (!existsSync(pinPath)) {
    console.error(`VSCODE_PIN.md not found at ${pinPath}`);
    process.exit(1);
  }
  const content = readFileSync(pinPath, "utf8");
  const match = content.match(/Tag pin\s*\|\s*`([^`]+)`/);
  if (!match) {
    console.error("Could not parse Tag pin from VSCODE_PIN.md");
    process.exit(1);
  }
  return match[1].trim();
}

const VSCODE_TAG = readPinnedTag();

console.log("=== Init Code-OSS submodule ===");
console.log(`Target tag: ${VSCODE_TAG}`);

function readPackageVersion() {
  if (!existsSync(path.join(vscodeRoot, "package.json"))) return undefined;
  try {
    const pkg = JSON.parse(readFileSync(path.join(vscodeRoot, "package.json"), "utf8"));
    return pkg.version;
  } catch {
    return undefined;
  }
}

function gitDescribe() {
  try {
    return execSync("git describe --tags --exact-match", {
      cwd: vscodeRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
  } catch {
    try {
      return execSync("git describe --tags", {
        cwd: vscodeRoot,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"]
      }).trim();
    } catch {
      return undefined;
    }
  }
}

function validateVendor() {
  const pkgVersion = readPackageVersion();
  const described = gitDescribe();
  if (pkgVersion === VSCODE_TAG && described === VSCODE_TAG) {
    console.log(`vendor/vscode already present at ${VSCODE_TAG} — OK`);
    return true;
  }
  if (pkgVersion === VSCODE_TAG) {
    console.log(`vendor/vscode at package version ${VSCODE_TAG} (git describe: ${described ?? "unknown"}) — OK`);
    return true;
  }
  return false;
}

if (existsSync(vscodeRoot)) {
  if (validateVendor()) {
    process.exit(0);
  }
  console.error(
    `vendor/vscode exists but version is ${readPackageVersion() ?? "unknown"} (expected ${VSCODE_TAG}).`
  );
  console.error("Delete apps/princy-code/vendor/vscode and re-run init.");
  process.exit(1);
}

mkdirSync(path.join(princyCodeRoot, "vendor"), { recursive: true });

try {
  execSync(`git clone --depth 1 --branch ${VSCODE_TAG} ${VSCODE_REPO} "${vscodeRoot}"`, {
    stdio: "inherit"
  });
} catch {
  console.log("Direct clone failed — trying submodule add...");
  try {
    execSync(
      `git submodule add -b ${VSCODE_TAG} --depth 1 ${VSCODE_REPO} apps/princy-code/vendor/vscode`,
      { cwd: repoRoot, stdio: "inherit" }
    );
  } catch {
    console.error(`Failed to clone vscode tag ${VSCODE_TAG}`);
    process.exit(1);
  }
}

const version = readPackageVersion();
const described = gitDescribe();

if (version !== VSCODE_TAG) {
  console.error(`Clone succeeded but package.json version is ${version} — expected ${VSCODE_TAG}`);
  process.exit(1);
}

if (described && described !== VSCODE_TAG) {
  console.error(`git describe is ${described} — expected ${VSCODE_TAG}`);
  process.exit(1);
}

console.log(`Pinned: ${version} (git describe: ${described ?? version})`);
console.log("Next:");
console.log("  1. Use Node.js 24.15.0+ (nvm use 24.15.0) — see apps/princy-code/VSCODE_PIN.md");
console.log("  2. cd apps/princy-code/vendor/vscode && npm ci");
console.log("  3. npm run princy-code:patch && npm run princy-code:compile");
