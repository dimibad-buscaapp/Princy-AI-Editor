import "dotenv/config";
import { defineConfig, env } from "prisma/config";

process.env.DATABASE_URL ??= "postgresql://postgres:SENHA@localhost:5432/princy_ai_editor";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});
