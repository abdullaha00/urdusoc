/**
 * The society's past events, for import by `npm run db:import-events`.
 *
 * Transcribed from the committee's own term cards. Titles and subtitles are the
 * cards' wording — summaries deliberately restate the card rather than
 * embellishing it, since nobody now recalls the detail. A committee member who
 * remembers more can expand any of them at /admin/events.
 *
 * Neither card records a time, and only one records a venue. Rather than invent
 * either, an entry whose `startsAt` is a bare date (`2025-10-12`) is stored with
 * `showTime` false and the site shows the date alone. Add a time — making it
 * `2025-10-12T19:00` — and the time appears.
 *
 * Entries still marked TODO are reported and skipped, never inserted.
 */

/** Marks a field nobody has confirmed yet. The importer refuses these. */
export const TODO = "TODO";

export type PastEventInput = {
  title: string;
  /** Optional Urdu title, shown in Nastaliq beside the English. */
  titleUrdu?: string;
  /**
   * What shape the evening took. Whether a partner society was involved is a
   * separate question — see `collaborators`.
   */
  kind: "mushaira" | "social" | "workshop" | "talk";
  /**
   * The colour band on /events. Optional: when omitted it is derived from
   * `kind` by `categoryFor` below, which is right for most entries. Set it
   * explicitly only where the derived value reads wrongly.
   */
  category?: "academic" | "cultural" | "social";
  /**
   * Co-hosting societies, e.g. ["PakSoc"]. A non-empty list marks the event as
   * a collaboration; omit it entirely for a standalone evening.
   */
  collaborators?: string[];
  /** Optional decorative Urdu label on the card, e.g. محفل. */
  kindUrdu?: string;
  /** One sentence — used on cards and in search results. */
  summary: string;
  /** Optional longer description. */
  body?: string;
  /**
   * "YYYY-MM-DD" when only the date is known, or "YYYY-MM-DDTHH:mm" (London
   * wall clock) when the time is too. 7pm is "19:00".
   */
  startsAt: string;
  /** Omit entirely when the venue was never recorded. */
  venue?: string;
  /** Which term card this came from. Not shown on the site. */
  term: string;
  /** How this was confirmed. Not shown on the site. */
  source: string;
};

/**
 * The default colour band for a kind, matching the backfill in migration 0002
 * so imported events and migrated ones are categorised the same way.
 */
export function categoryFor(
  event: PastEventInput,
): "academic" | "cultural" | "social" {
  if (event.category) return event.category;
  if (event.kind === "workshop" || event.kind === "talk") return "academic";
  if (event.kind === "social") return "social";
  return "cultural";
}

const MICHAELMAS_2025 = "Michaelmas 2025";
const LENT_2026 = "Lent 2026";
const CARD_M = "Michaelmas 2025 term card (committee)";
const CARD_L = "Lent 2026 term card (committee)";

export const pastEvents: PastEventInput[] = [
  /* Michaelmas 2025 ------------------------------------------------------- */

  {
    title: "Chai and Chat!",
    kind: "social",
    summary: "Freshers' event — meet the committee.",
    startsAt: "2025-10-12",
    term: MICHAELMAS_2025,
    source: CARD_M,
  },
  {
    title: "South Asian Cambridge Walk",
    kind: "social",
    category: "cultural",
    collaborators: ["PakSoc"],
    summary: "A walk through South Asian Cambridge, with PakSoc.",
    // The card reads "OCT TBC" — no date was ever printed.
    startsAt: TODO,
    term: MICHAELMAS_2025,
    source: CARD_M,
  },
  {
    title: "Jinn-o-ween",
    kind: "mushaira",
    summary: "A themed open mic.",
    startsAt: "2025-10-26",
    term: MICHAELMAS_2025,
    source: CARD_M,
  },
  {
    title: "Mushaira — Iqbal Day",
    kind: "mushaira",
    kindUrdu: "محفل",
    summary: "A mushaira marking Iqbal Day, with Chai Shai.",
    startsAt: "2025-11-09",
    term: MICHAELMAS_2025,
    source: CARD_M,
  },
  {
    title: "'Home Away From Home'",
    kind: "workshop",
    summary: "Shayari scrapbooking.",
    // The card reads "NOV TBC".
    startsAt: TODO,
    term: MICHAELMAS_2025,
    source: CARD_M,
  },
  {
    title: "In Conversation with Ghazal Studio",
    kind: "talk",
    summary: "In conversation with Ghazal Studio.",
    startsAt: "2025-11-28",
    term: MICHAELMAS_2025,
    source: CARD_M,
  },
  {
    title: "Chai and Chat! — End of Term Social",
    kind: "social",
    summary: "End of term social.",
    startsAt: "2025-11-29",
    term: MICHAELMAS_2025,
    source: CARD_M,
  },

  /* Lent 2026 ------------------------------------------------------------- */

  {
    title: "UrduSoc Brunch",
    kind: "social",
    summary: "Brunch, with Speaking Class 1.",
    startsAt: "2026-01-24",
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "South Asian Tour",
    kind: "social",
    collaborators: ["Jack's Social"],
    summary: "A South Asian tour, with Jack's Social.",
    // The card reads "WEEK 01" rather than a date.
    startsAt: TODO,
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "Urdu Teach-in & Workshop 1 — In-Safar-able: Comic Relief After Grief",
    kind: "workshop",
    summary: "Teach-in and workshop with Rawanee Creatives.",
    startsAt: "2026-02-01",
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "UrduSoc Games Night",
    kind: "social",
    summary: "Games night.",
    // The card reads "WEEK 03".
    startsAt: TODO,
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "UrduSoc Brunch — Speaking Class 2",
    kind: "social",
    summary: "Brunch, with Speaking Class 2.",
    startsAt: "2026-02-08",
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "Open Mic Night",
    kind: "mushaira",
    collaborators: ["CamSAMS", "Majlis", "PakSoc"],
    summary: "An open mic with CamSAMS, Majlis and PakSoc.",
    // The one venue either card records.
    venue: "Clare Cellars",
    // The card reads "WEEK 04".
    startsAt: TODO,
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title:
      "Urdu Teach-in & Workshop 2 — Faiz and the Progressive Writers Movement",
    kind: "workshop",
    summary: "Teach-in and workshop on Faiz and the Progressive Writers Movement, with Taha.",
    startsAt: "2026-02-15",
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "The Indian Caliphate: Poetry, Power, and Exile",
    kind: "talk",
    summary: "In conversation with Imran Mulla.",
    // The card reads "WEEK 04".
    startsAt: TODO,
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "Iftar Potluck",
    kind: "social",
    summary: "Iftar potluck, with Speaking Class 3.",
    startsAt: "2026-02-22",
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "Urdu Teach-in and Workshop 3",
    kind: "workshop",
    summary: "The third Urdu teach-in and workshop of the term.",
    startsAt: "2026-03-01",
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "Iftar Potluck — Speaking Class 4",
    kind: "social",
    summary: "Iftar potluck, with Speaking Class 4.",
    startsAt: "2026-03-08",
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "End of Term Social: Shayari Scrapbooking",
    kind: "social",
    summary: "End of term social — shayari scrapbooking.",
    startsAt: "2026-03-15",
    term: LENT_2026,
    source: CARD_L,
  },

  /* Found in public listings, not on either card ---------------------------- */

  {
    title: "A Musical Night with Ghazal Studio",
    kind: "mushaira",
    collaborators: ["Ghazal Studio"],
    summary:
      "An evening of ghazals, ragas and devotional songs with tabla player Keval Joshi of Ghazal Studio, joined by singers Ekta Rana and Nirmal Joshi. Free and open to all.",
    // May be the same event as "In Conversation with Ghazal Studio" above
    // (28 Nov 2025) — the titles and descriptions differ, so they are kept
    // apart until someone who was there says otherwise. Delete whichever is
    // wrong rather than importing both.
    startsAt: TODO,
    term: TODO,
    source:
      "https://www.cmp.cam.ac.uk/events/event/item/cambridge-university-urdu-society-presents-a-musical-night-with-ghazal-studio-2/ — open in a browser for the date and venue",
  },
  {
    title: "The History of the Ghazal",
    kind: "talk",
    summary:
      "Poet Shadab Zeest Hashmi on the history of the ghazal and its part in the making of the Urdu language.",
    // On neither term card, so probably an earlier year.
    startsAt: TODO,
    term: TODO,
    source: "Society Facebook announcement — date given only as 'end of term'",
  },
];
