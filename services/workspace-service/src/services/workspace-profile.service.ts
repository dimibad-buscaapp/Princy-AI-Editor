import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@princy/database";

async function readJsonSafe(filePath: string) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function listDirs(root: string, name: string) {
  try {
    const dir = path.join(root, name);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

function cuid() {
  return `wp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function buildWorkspaceProfile(workspacePath: string, workspaceId: string) {
  const pkg = await readJsonSafe(path.join(workspacePath, "package.json"));
  const tsconfig = await readJsonSafe(path.join(workspacePath, "tsconfig.json"));
  const compose = await readJsonSafe(path.join(workspacePath, "docker-compose.yml"))
    ?? await readJsonSafe(path.join(workspacePath, "docker-compose.yaml"));

  const apps = await listDirs(workspacePath, "apps");
  const services = await listDirs(workspacePath, "services");
  const packages = await listDirs(workspacePath, "packages");
  const scripts = (pkg?.scripts ?? {}) as Record<string, string>;
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };

  const ports: number[] = [];
  if (compose?.services) {
    for (const svc of Object.values(compose.services as Record<string, { ports?: string[] }>)) {
      for (const p of svc.ports ?? []) {
        const n = parseInt(String(p).split(":")[0], 10);
        if (!Number.isNaN(n)) ports.push(n);
      }
    }
  }

  const framework = pkg?.dependencies?.next ? "next" : pkg?.dependencies?.react ? "react" : null;
  const language = tsconfig ? "typescript" : "javascript";
  const packageManager = await fs.access(path.join(workspacePath, "pnpm-lock.yaml")).then(() => "pnpm").catch(() =>
    fs.access(path.join(workspacePath, "yarn.lock")).then(() => "yarn").catch(() => "npm")
  );

  const risks: string[] = [];
  try {
    await fs.readFile(path.join(workspacePath, "README.md"), "utf8");
  } catch {
    risks.push("Missing README.md");
  }
  if (Object.keys(scripts).length === 0) risks.push("No npm scripts defined");

  const servicesJson = JSON.stringify({ apps, services, packages, composeServices: Object.keys(compose?.services ?? {}) });
  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "WorkspaceProfile" WHERE "workspaceId" = ${workspaceId} LIMIT 1
  `;

  if (existing[0]) {
    await prisma.$executeRaw`
      UPDATE "WorkspaceProfile" SET
        framework = ${framework},
        language = ${language},
        "packageManager" = ${packageManager},
        services = ${servicesJson}::jsonb,
        ports = ${JSON.stringify(ports)}::jsonb,
        scripts = ${JSON.stringify(scripts)}::jsonb,
        database = ${deps["@prisma/client"] ? JSON.stringify({ orm: "prisma" }) : null}::jsonb,
        deployment = ${compose ? JSON.stringify({ type: "docker-compose" }) : null}::jsonb,
        risks = ${JSON.stringify(risks)}::jsonb,
        "updatedAt" = NOW()
      WHERE "workspaceId" = ${workspaceId}
    `;
  } else {
    const id = cuid();
    await prisma.$executeRaw`
      INSERT INTO "WorkspaceProfile" (id, "workspaceId", framework, language, "packageManager", services, ports, scripts, database, deployment, risks, "createdAt", "updatedAt")
      VALUES (${id}, ${workspaceId}, ${framework}, ${language}, ${packageManager}, ${servicesJson}::jsonb, ${JSON.stringify(ports)}::jsonb, ${JSON.stringify(scripts)}::jsonb, ${deps["@prisma/client"] ? JSON.stringify({ orm: "prisma" }) : null}::jsonb, ${compose ? JSON.stringify({ type: "docker-compose" }) : null}::jsonb, ${JSON.stringify(risks)}::jsonb, NOW(), NOW())
    `;
  }

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT * FROM "WorkspaceProfile" WHERE "workspaceId" = ${workspaceId} LIMIT 1
  `;
  return rows[0];
}
