import { PrismaClient } from "@prisma/client";

import { isDatabaseUnavailable } from "@/lib/errors";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Neon pooler + Next.js (esp. Turbopack HMR) can exhaust the default pool.
 * Keep a small limit and longer timeout so stale sockets recover cleanly.
 */
function datasourceUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    // Neon pooler is shared. Keep Prisma's client pool modest, but high enough
    // for RSC pages that load chrome + listings + widgets in one request.
    // Dev used to sit at 5 and routinely hit P2024 (pool timeout).
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "10");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function createPrismaClient() {
  const client = new PrismaClient({
    datasources: {
      db: { url: datasourceUrl() },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Neon pooler can drop idle sockets (kind: Closed). Retry once after a
  // disconnect so the next query opens a fresh connection.
  return client.$extends({
    name: "transient-retry",
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (!isDatabaseUnavailable(error)) throw error;
          try {
            await client.$disconnect();
          } catch {
            // ignore — the next query will reconnect
          }
          return query(args);
        }
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
