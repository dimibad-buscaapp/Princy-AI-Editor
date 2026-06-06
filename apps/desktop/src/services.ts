import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

let monorepoProc: ChildProcess | null = null;

export function resolveMonorepoRoot(): string {
  if (process.env.PRINCY_MONOREPO_ROOT) {
    return path.resolve(process.env.PRINCY_MONOREPO_ROOT);
  }
  if (app.isPackaged) {
    return path.resolve(path.dirname(app.getPath("exe")), "..");
  }
  return path.resolve(__dirname, "../../..");
}

export function startMonorepo(): ChildProcess | null {
  if (monorepoProc) return monorepoProc;

  const root = resolveMonorepoRoot();
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) {
    console.warn({ root }, "monorepo package.json not found; skipping auto-start");
    return null;
  }

  monorepoProc = spawn("npm", ["run", "start"], {
    cwd: root,
    shell: true,
    stdio: "ignore",
    env: { ...process.env, FORCE_COLOR: "0" }
  });

  monorepoProc.on("exit", () => {
    monorepoProc = null;
  });

  return monorepoProc;
}

export function stopMonorepo(): void {
  if (!monorepoProc) return;
  monorepoProc.kill();
  monorepoProc = null;
}
