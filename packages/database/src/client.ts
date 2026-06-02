import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  princyPrisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:SENHA@localhost:5432/princy_ai_editor";
const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.princyPrisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.princyPrisma = prisma;
}
