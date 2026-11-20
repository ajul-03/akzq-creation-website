import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prismaInstance: PrismaClient | undefined;
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export function getDb(): PrismaClient {
  if (!globalForPrisma.prismaInstance) {
    globalForPrisma.prismaInstance = createClient();
  }
  return globalForPrisma.prismaInstance;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb();
    const val = Reflect.get(client, prop);
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
