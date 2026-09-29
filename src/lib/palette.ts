/**
 * Which colour palette the site renders in.
 *
 * Two are defined, and switching between them is a one-word edit here — the
 * point is to be able to look at both on a real page before committing.
 *
 *   "archive"  — the palette the site was built in: cool parchment (#faf6ec),
 *                near-black ink, deep emerald. Higher contrast, more crispness.
 *
 *   "heritage" — the values the 2026 committee brief specified: a sandier
 *                ground (#E2D9CC), soft charcoal text (#434242), off-white
 *                panels (#E1DBD2). Warmer and quieter; closer to a printed
 *                exhibition catalogue.
 *
 * Both keep the emerald / burgundy / gold accents, because those carry the
 * hierarchy — headings, links and labels stop being distinguishable without
 * them. The brief did not specify accents, so they were not the thing in
 * dispute; only the ground and the ink were.
 *
 * Both clear WCAG AA on every text token. Worth knowing if you retune them:
 * the heritage ground is light enough that the brief's own muted grey
 * (#6b6862) and gold (#7d5a1c) landed at 3.97:1 and 4.49:1 — both under the
 * 4.5:1 floor for body text — so globals.css darkens them slightly. If you
 * change a ground, re-check the muted tones against it rather than assuming.
 */
export type Palette = "archive" | "heritage";

/** Change this word, reload, and compare. */
export const SITE_PALETTE: Palette = "archive";
