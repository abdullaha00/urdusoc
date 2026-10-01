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
  /** postgres-js spelling - production. */
  constraint_name?: string;
  /** node-postgres and PGlite spelling - the local development database. */
  constraint?: string;
  cause?: unknown;
};

/**
 * True when the error is a Postgres unique-violation (23505), optionally for a
 * specific constraint. Drizzle wraps driver errors, so the cause chain is
 * walked rather than the top-level error alone.
 *
 * Both spellings of the constraint field are checked: production talks to Neon
 * through postgres-js, which reports `constraint_name`, while `npm run dev:db`
 * is PGlite, which reports `constraint`. Reading only one means a constraint
 * named here matches in production but not locally, which turns a handled
 * duplicate into a generic "something went wrong" on exactly the machine where
 * it would be diagnosed.
 */
export function isUniqueViolation(
  error: unknown,
  constraintName?: string,
): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as PostgresErrorish;
    if (candidate.code === "23505") {
      if (!constraintName) return true;
      return (
        candidate.constraint_name === constraintName ||
        candidate.constraint === constraintName
      );
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
