/**
 * A throwaway Postgres for local development, running in this process.
 *
 * Start it with `npm run dev:db`, leave it running, and point DATABASE_URL at
 * postgres://postgres:postgres@localhost:5432/postgres. It applies migrations
 * and seeds itself on start, so a new committee member can get the whole site
 * running without installing Postgres or signing up for anything.
 *
 * Data is kept in .pglite/ and is git-ignored. Not for production.
 */

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/lib/db/schema";
import { seed } from "../src/lib/db/seed";

const PORT = Number(process.env.DEV_DB_PORT ?? 5432);

const client = await PGlite.create({ dataDir: "./.pglite" });
const db = drizzle(client, { schema });

console.log("Applying migrations…");
await migrate(db, { migrationsFolder: "./drizzle" });

console.log("Seeding…");
const summary = await seed(db, process.env.SEED_ADMIN_EMAIL ?? "committee@example.com");
for (const line of summary) console.log(`  ${line}`);

const server = new PGLiteSocketServer({ db: client, port: PORT, host: "127.0.0.1" });
await server.start();

console.log(`\nDevelopment database listening on port ${PORT}.`);
console.log(
  `DATABASE_URL="postgresql://postgres:postgres@localhost:${PORT}/postgres"\n`,
);

const shutdown = async () => {
  await server.stop();
  await client.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
