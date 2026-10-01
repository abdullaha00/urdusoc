/**
 * Prints the heading row for the events spreadsheet, tab-separated.
 *
 *   npm run sheet:headers
 *
 * Paste the output into cell A1 of a new sheet and Google splits it across the
 * columns for you. Existing sheets do not need this: the sync finds columns by
 * their heading, accepts several spellings of each, and ignores any extra
 * columns the committee keeps for itself.
 */

import { CANONICAL_HEADERS } from "../src/lib/sheets/event-row";

console.log(CANONICAL_HEADERS.join("\t"));
