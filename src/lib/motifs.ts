/**
 * The album motifs that actually have a drawing behind them.
 *
 * `Motif` in src/components/past-moments.tsx renders a specific design for each
 * of these and falls through to a generic one for anything else. Keeping the
 * list here — rather than as a free-text field — stops the committee choosing a
 * motif that silently does nothing.
 *
 * Lives in its own module because the admin's server actions need it, and a
 * "use server" file may only export async functions.
 */

export const MOTIFS = [
  { value: "mushaira", label: "Mushaira — emerald and gold" },
  { value: "chai", label: "Chai — burgundy circles" },
  { value: "calligraphy", label: "Calligraphy — ruled paper" },
] as const;

export const MOTIF_VALUES = ["mushaira", "chai", "calligraphy"] as const;

export type Motif = (typeof MOTIF_VALUES)[number];
