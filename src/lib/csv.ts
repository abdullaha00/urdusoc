/**
 * CSV export for the committee's spreadsheets.
 *
 * Exports land in Excel or Google Sheets, which drives two decisions below: a
 * UTF-8 BOM so Urdu names are not mangled, and an escape for fields that would
 * otherwise be read as formulas.
 */

export type CsvValue = string | number | boolean | Date | null | undefined;

/** Characters that make a spreadsheet treat a cell as a formula. */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function serialize(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

function escapeField(value: CsvValue): string {
  let text = serialize(value);

  // CSV injection: a name like "=cmd|..." is executed by Excel on open. A
  // leading apostrophe makes it literal text and is stripped on display.
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;

  // RFC 4180: quote anything containing a delimiter, quote or newline, and
  // double any embedded quotes.
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;

  return text;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [
    headers.map(escapeField).join(","),
    ...rows.map((row) => row.map(escapeField).join(",")),
  ];
  // CRLF per RFC 4180.
  return lines.join("\r\n");
}

/**
 * A downloadable CSV response.
 *
 * The BOM is what makes Excel open the file as UTF-8 rather than the local
 * codepage — without it the committee's Urdu names arrive as mojibake.
 */
export function csvResponse(filename: string, csv: string): Response {
  return new Response(`﻿${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      // Never let a proxy or the browser hold on to personal data.
      "cache-control": "no-store",
    },
  });
}

/** "urdusoc-members-2026-08-06.csv" */
export function csvFilename(stem: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `urdusoc-${stem}-${today}.csv`;
}
