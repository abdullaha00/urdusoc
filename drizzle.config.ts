import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit is a plain CLI, so nothing has loaded `.env.local` for it the way
 * `next dev` does for the app - without this, every `db:*` command fails with
 * an empty `url`. Real environments (Vercel, CI) have no `.env.local` and pass
 * DATABASE_URL in the environment already, so a missing file is not an error.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // No such file - the variables are expected to be in the environment.
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
