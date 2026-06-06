import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

async function run(cmd: string, args: string[], timeoutMs = 5000): Promise<string> {
  try {
    const { stdout } = await exec(cmd, args, { timeout: timeoutMs });
    return stdout.trim();
  } catch (error) {
    return error instanceof Error ? error.message : "failed";
  }
}

export async function getDevOpsStatus() {
  const [pm2, redis, postgres, ollama, ports] = await Promise.all([
    run("pm2", ["jlist"]),
    run("redis-cli", ["ping"]),
    run("pg_isready", []),
    fetch(`${process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"}/api/tags`).then((r) => (r.ok ? "ok" : "fail")).catch(() => "fail"),
    run("ss", ["-tlnp"])
  ]);

  let pm2Online = 0;
  try {
    const list = JSON.parse(pm2) as Array<{ pm2_env?: { status?: string } }>;
    pm2Online = list.filter((p) => p.pm2_env?.status === "online").length;
  } catch {
    pm2Online = 0;
  }

  return {
    pm2: { raw: pm2.slice(0, 500), online: pm2Online },
    redis: { status: redis },
    postgres: { status: postgres },
    ollama: { status: ollama },
    ports: { raw: ports.slice(0, 1000) },
    checkedAt: new Date().toISOString()
  };
}

export async function diagnoseTarget(target: string) {
  switch (target) {
    case "pm2":
      return { target, output: await run("pm2", ["status"]) };
    case "docker":
      return { target, output: await run("docker", ["ps", "--format", "{{.Names}}\t{{.Status}}"]) };
    case "database":
      return { target, output: await run("pg_isready", ["-h", "127.0.0.1"]) };
    case "nginx":
      return { target, output: await run("systemctl", ["is-active", "nginx"]) };
    case "redis":
      return { target, output: await run("redis-cli", ["info", "server"]) };
    case "ollama":
      return {
        target,
        output: await fetch(`${process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"}/api/tags`).then((r) => r.text())
      };
    default:
      return { target, output: await getDevOpsStatus() };
  }
}

const DESTRUCTIVE_PATTERNS = [/rm\s+-rf/i, /drop\s+database/i, /truncate/i, /mkfs/i, /shutdown/i];

export function isDestructiveCommand(command: string): boolean {
  return DESTRUCTIVE_PATTERNS.some((p) => p.test(command));
}
