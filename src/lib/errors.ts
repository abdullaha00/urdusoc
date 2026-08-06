/**
 * Error helpers for server actions.
 *
 * The rule: only `UserFacingError` messages are ever shown to a visitor.
 * Everything else is logged and replaced with a generic line, so database
 * errors never leak SQL or column names into the page.
 */

export class UserFacingError extends Error {}

type PostgresErrorish = {
  code?: string;
  constraint_name?: string;
  cause?: unknown;
};

/**
 * True when the error is a Postgres unique-violation (23505), optionally for a
 * specific constraint. Drizzle wraps driver errors, so the cause chain is
 * walked rather than the top-level error alone.
 */
export function isUniqueViolation(
  error: unknown,
  constraintName?: string,
): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as PostgresErrorish;
    if (candidate.code === "23505") {
      return !constraintName || candidate.constraint_name === constraintName;
    }
    current = candidate.cause;
  }

  return false;
}

/** Message to show for an unexpected failure, after logging the real one. */
export function reportUnexpected(context: string, error: unknown): string {
  console.error(`${context}:`, error);
  return "Something went wrong at our end. Please try again in a moment.";
}
