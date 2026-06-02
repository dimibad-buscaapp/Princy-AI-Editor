import { spawnSync } from "node:child_process";

process.env.DATABASE_URL ??= "postgresql://postgres:SENHA@localhost:5432/princy_ai_editor";

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Missing command.");
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  shell: true,
  env: process.env
});

process.exit(result.status ?? 1);
