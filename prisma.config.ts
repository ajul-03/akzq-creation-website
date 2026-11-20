import "dotenv/config";
import { defineConfig } from "@prisma/config";

function getMigrationDatasourceUrl(): string {
  if (process.env.DIRECT_URL) {
    return process.env.DIRECT_URL;
  }

  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return process.env.DATABASE_URL;
      }
    } catch {}

    throw new Error(
      "DIRECT_URL is required for migrations on non-localhost databases. Silent fallback to pooled DATABASE_URL is disallowed."
    );
  }

  return "";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getMigrationDatasourceUrl(),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
