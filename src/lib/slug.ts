/**
 * URL slugs for events and albums.
 *
 * Titles here are frequently Urdu or transliterated, so the ASCII fallback
 * matters: "محفلِ شاعری" reduces to nothing, and a row with an empty slug would
 * collide with the next one. When nothing survives, a short random suffix is
 * used instead and the committee can type a better one over it.
 */

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function randomSuffix(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export function slugify(input: string, fallbackStem = "item"): string {
  const slug = input
    .normalize("NFKD")
    // Strip the combining marks decomposition leaves behind, so "é" -> "e".
    // The range is U+0300–U+036F; the characters are invisible in an editor.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // Drop apostrophes rather than turning them into separators.
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return slug || `${fallbackStem}-${randomSuffix()}`;
}
