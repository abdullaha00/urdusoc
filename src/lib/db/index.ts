import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

function createDb(connectionString: string) {
  const client = postgres(connectionString, {
    // Required when talking to a connection pooler (Neon's -pooler endpoint,
    // PgBouncer in transaction mode, etc).
    prepare: false,
    // One connection per server instance. Serverless functions are already
    // horizontally scaled, so a pool inside each one buys nothing — and the
    // local development database (see scripts/dev-db.mts) only accepts one.
    max: 1,
  });
  return drizzle(client, { schema });
}

// Reused across hot reloads in development so we don't leak connections.
const globalForDb = globalThis as unknown as { urduSocDb?: Database };

let instance: Database | undefined = globalForDb.urduSocDb;

/**
 * The database handle. Connects on first use rather than at import time, so
 * `next build` works on a machine with no DATABASE_URL.
 */
export function getDb(): Database {
  if (!instance) {
    instance = createDb(env.databaseUrl);
    if (process.env.NODE_ENV !== "production") {
      globalForDb.urduSocDb = instance;
    }
  }
  return instance;
}

export { schema };
