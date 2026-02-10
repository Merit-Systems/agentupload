import { env } from "@/env";
import { PrismaClient } from "../../generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import { Pool as PgPool } from "pg";

const isNeon = env.DATABASE_URL.includes("neon.tech");

if (isNeon) {
  neonConfig.poolQueryViaFetch = true;
}

const createPrismaClient = () => {
  const adapter = isNeon
    ? new PrismaNeon({ connectionString: env.DATABASE_URL })
    : new PrismaPg(new PgPool({ connectionString: env.DATABASE_URL }));

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
