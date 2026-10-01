"use client";

import { useState } from "react";

const fontThemes = [
  ["A", "Newsreader · Source Sans 3 · Gulzar"],
  ["B", "EB Garamond · Inter · Noto Nastaliq Urdu"],
  ["C", "Instrument Serif · Instrument Sans · Gulzar"],
  ["D", "Libre Caslon Text · Source Sans 3 · Noto Nastaliq Urdu"],
  ["E", "Cormorant Garamond · Manrope · Gulzar"],
] as const;

type FontTheme = (typeof fontThemes)[number][0];

export function FontThemeSwitcher() {
  const [theme, setTheme] = useState<FontTheme>("A");

  return (
    <label className="fixed right-4 bottom-4 z-[60] flex items-center gap-2 border border-forest/20 bg-paper px-3 py-2 text-xs text-ink shadow-paper">
      <span className="font-semibold text-forest">Type</span>
      <select
        value={theme}
        onChange={(event) => {
          const nextTheme = event.target.value as FontTheme;
          setTheme(nextTheme);
          document.documentElement.dataset.fontTheme = nextTheme;
        }}
        className="max-w-64 bg-paper text-ink outline-none"
      >
        {fontThemes.map(([id, name]) => (
          <option key={id} value={id}>
            {id} · {name}
          </option>
        ))}
      </select>
    </label>
  );
}
