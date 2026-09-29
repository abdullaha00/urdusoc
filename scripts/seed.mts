/**
 * Seeds the database pointed at by DATABASE_URL.
 * Run migrations first: `npm run db:migrate`.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { seed } from "../src/lib/db/seed";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

const summary = await seed(db, process.env.SEED_ADMIN_EMAIL);
for (const line of summary) console.log(`  ${line}`);

await client.end();
console.log("Seed complete.");
