/**
 * Short booking references, e.g. "URDU-4K7P2M".
 *
 * Uses an alphabet without 0/O/1/I/L so a reference read aloud at the door
 * cannot be transcribed two ways.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateReference(prefix = "URDU"): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const code = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join(
    "",
  );
  return `${prefix}-${code}`;
}

/** Opaque token for confirm/unsubscribe links. */
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
