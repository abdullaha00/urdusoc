/**
 * Runs the Google Sheet sync from a terminal.
 *
 * This is how you check a spreadsheet before anyone depends on it - the same
 * code the cron job and the /admin/events button run, but with the rejected
 * rows printed where you can read them.
 *
 *   npm run sheet:sync
 *
 * Needs DATABASE_URL, EVENTS_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and
 * GOOGLE_SERVICE_ACCOUNT_KEY - all of which `.env.local` supplies.
 */

import { syncEventsFromSheet } from "../src/lib/sheets/sync";

const missing = [
  "DATABASE_URL",
  "EVENTS_SHEET_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_KEY",
].filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Not set: ${missing.join(", ")}. See .env.example.`);
  process.exit(1);
}

console.log("\nReading the events spreadsheet…\n");

const report = await syncEventsFromSheet({ trigger: "manual" });

if (!report.ok) {
  console.error(`Failed: ${report.errorMessage}\n`);
  process.exit(1);
}

console.log(`  ${report.rowsRead} row(s) read`);
console.log(`  ${report.created} added`);
console.log(`  ${report.updated} updated`);
console.log(`  ${report.unpublished} unpublished (no longer in the sheet)`);

if (report.problems.length > 0) {
  console.log(`\n${report.problems.length} row(s) skipped:`);
  for (const problem of report.problems) console.log(`  · ${problem}`);
  console.log("\nThose events are not on the site. Fix the rows and re-run.\n");
} else {
  console.log("\nNo problems.\n");
}

// postgres-js keeps its socket open, so the process would otherwise hang.
process.exit(0);
