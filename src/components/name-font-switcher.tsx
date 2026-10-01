"use client";

import { useState } from "react";

/**
 * Development-only preview for the society name under the header wordmark.
 *
 * The same idea as FontThemeSwitcher, and it stacks above it: pick a setting,
 * see it in the real header rather than in a screenshot. Nothing here ships -
 * layout.tsx renders it only in development - so the candidate styles live in
 * this file's own <style> block instead of globals.css.
 *
 * Two things to know while looking at it:
 *
 *  - The caption is deliberately hidden below 640px and again between 1024 and
 *    1279px, where the nav needs the room. If you cannot see it, widen the
 *    window past 1280 rather than assuming the switcher is broken.
 *  - Each option is paired with the width it costs in the widest font theme
 *    (D, Libre Caslon). The header has about 346px for the name before the nav
 *    starts being squeezed, so anything past roughly 300 is living dangerously.
 *    Check a pick against theme D in the Type switcher below.
 */

/** id, menu label, CSS for the caption. */
const nameFonts = [
  [
    "footer-100",
    "Serif sentence · 1.- / tight — 254px (shipped)",
    "font-family:var(--font-serif);font-size:1rem;letter-spacing:-0.025em;text-transform:none;",
  ],
  [
    "serif-66",
    "Serif caps · .66 /-.14 — 279px",
    "font-family:var(--font-serif);font-size:0.66rem;letter-spacing:0.14em;text-transform:uppercase;",
  ],
  [
    "serif-70",
    "Serif · .70 / .12 - 288px",
    "font-family:var(--font-serif);font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;",
  ],
  [
    "serif-70-wide",
    "Serif · .70 / .16 - 303px",
    "font-family:var(--font-serif);font-size:0.7rem;letter-spacing:0.16em;text-transform:uppercase;",
  ],
  [
    "serif-80",
    "Serif · .80 / .14 — 323px",-
    "font-family:var(--font-serif);font-size:0.8rem;letter-spacing:0.14em;text-transform:uppercase;",
  ],
  [
    "smallcaps",
    "Serif small caps · .95 / .06 — 272px",
    "font-family:var(--font-serif);font-size:0.95rem;letter-spacing:0.06em;text-transform:none;font-variant:small-caps;",
  ],
  /*
    Sentence case, the way the hero headline and the footer already set this
    name: serif with tracking-tight (-0.025em), no letterspacing, no caps. The
    footer's own lockup is this ex-ct treatment at text-xl, so these are the
    house style for the society's name rather than a new idea.
  */
  [
    "footer-80",
    "Serif sentence · .80 / tight - 203px",
    "font-family:var(--font-serif);font-size:0.8rem;letter-spacing:-0.025em;text-transform:none;",
  ],
  [
    "footer-90",
    "Serif sentence · .90 / tight - 228px",
    "font-family:var(--font-serif);font-size:0.9rem;letter-spacing:-0.025em;text-transform:none;",
  ],
  [
    "hero-eyebrow",
    "Sans sentence · .75 / 500 / .06 - 201px (hero eyebrow)",
    "font-family:var(--font-sans);font-size:0.75rem;font-weight:500;letter-spacing:0.06em;text-transform:none;",
  ],
  [
    "sans-56",
    "Sans · .56 / .16 - 196px (the original)",
    "font-family:var(--font-sans);font-size:0.56rem;letter-spacing:0.16em;text-transform:uppercase;",
  ],
  [
    "sans-62",
    "Sans · .62 / 500 / .18 - 226px",
    "font-family:var(--font-sans);font-size:0.62rem;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;",
  ],
  [
    "sans-65",
    "Sans · .65 / 500 / .20 - 243px",
    "font-family:var(--font-sans);font-size:0.65rem;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;",
  ],
] as const;

type NameFont = (typeof nameFonts)[number][0];

/*
  Two attribute selectors plus the data hook, so these beat the Tailwind
  utilities already on the span without anyone reaching for !important.
*/
const css = nameFonts
  .map(
    ([id, , rules]) =>
      `html[data-name-font="${id}"] [data-society-name]{${rules}}`,
  )
  .join("\n");

export function NameFontSwitcher() {
  const [font, setFont] = useState<NameFont>("footer-100");

  return (
    <>
      <style>{css}</style>
      <label className="fixed right-4 bottom-16 z-[60] flex items-center gap-2 border border-forest/20 bg-paper px-3 py-2 text-xs text-ink shadow-paper">
        <span className="font-semibold text-forest">Name</span>
        <select
          value={font}
          onChange={(event) => {
            const next = event.target.value as NameFont;
            setFont(next);
            document.documentElement.dataset.nameFont = next;
          }}
          className="max-w-64 bg-paper text-ink outline-none"
          title="The header caption is hidden below 640px and between 1024 and 1279px."
        >
          {nameFonts.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
