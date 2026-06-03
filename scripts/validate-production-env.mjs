import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");

const PLACEHOLDER_MARKERS = [
  "CHANGE_ME",
  "GERAR_",
  "SUA_SENHA",
  "SENHA@",
  "postgres:SENHA"
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const vars = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      continue;
    }
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function isPlaceholder(value) {
  if (!value) {
    return true;
  }
  const upper = value.toUpperCase();
  return PLACEHOLDER_MARKERS.some((marker) => upper.includes(marker));
}

function requireVar(env, key, errors, options = {}) {
  const value = env[key];
  if (!value || isPlaceholder(value)) {
    errors.push(`${key} is missing or still a placeholder.`);
    return;
  }
  if (options.minLength && value.length < options.minLength) {
    errors.push(`${key} must be at least ${options.minLength} characters.`);
  }
}

function validateDatabaseUrl(url, errors) {
  if (!url || isPlaceholder(url)) {
    errors.push("DATABASE_URL is missing or still a placeholder.");
    return;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "postgresql:") {
      errors.push("DATABASE_URL must use postgresql:// scheme.");
    }
    if (!parsed.pathname || parsed.pathname === "/") {
      errors.push("DATABASE_URL must include database name.");
    }
  }
  catch {
    errors.push("DATABASE_URL is not a valid URL.");
  }
}

const env = loadEnvFile(envPath);
const errors = [];
const warnings = [];

if (!env) {
  console.error(`Missing .env at ${envPath}`);
  console.error("Run: npm run env:setup");
  process.exit(1);
}

validateDatabaseUrl(env.DATABASE_URL, errors);
requireVar(env, "JWT_SECRET", errors, { minLength: 32 });
requireVar(env, "JWT_REFRESH_SECRET", errors, { minLength: 32 });

const required = [
  "NODE_ENV",
  "HOST",
  "API_URL",
  "GATEWAY_URL",
  "MEMORY_SERVICE_URL",
  "NEXT_PUBLIC_GATEWAY_URL",
  "NEXT_PUBLIC_API_BASE_URL"
];

for (const key of required) {
  if (!env[key]) {
    errors.push(`${key} is not set.`);
  }
}

if (env.NODE_ENV !== "production") {
  warnings.push(`NODE_ENV=${env.NODE_ENV} (expected production on VPS).`);
}

if (!env.PRINCY_LOG_DIR) {
  warnings.push("PRINCY_LOG_DIR not set; logs may land in workspace subfolders.");
}

if (!env.OLLAMA_BASE_URL) {
  warnings.push("OLLAMA_BASE_URL not set; agents/memory embeddings will fail.");
}

if (errors.length) {
  console.error("Production .env validation FAILED:\n");
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  console.error("\nFix with: npm run env:setup");
  process.exit(1);
}

if (warnings.length) {
  console.warn("Warnings:");
  for (const message of warnings) {
    console.warn(`  - ${message}`);
  }
}

console.log(`OK: ${envPath} is valid for production (${Object.keys(env).length} variables).`);
