/**
 * The society's past events, for import by `npm run db:import-events`.
 *
 * Two sources sit behind this file. The Michaelmas 2025 and Lent 2026 entries
 * were transcribed from the committee's own term cards. Everything else - and
 * most of the dates, times and venues on the term-card entries too - comes from
 * the society's Instagram, scraped on 1 October 2026 and archived by
 * `npm run instagram:archive`. Most posts carry a poster with the date, time
 * and room printed on it; `source` cites the post, and the poster itself is on
 * disk at scripts/data/instagram/<date>-<shortcode>-01.jpg.
 *
 * Summaries stay close to what the card or the poster actually said. Where a
 * caption and its own poster disagree - the committee moved two events after
 * printing the artwork - the caption wins, because it is the later word, and
 * the move is noted in `body` so the archive does not quietly erase it.
 *
 * Where a term card and a poster disagree about a date, the poster wins and the
 * conflict is left in a comment. These are sourced corrections, not guesses: a
 * date nobody has evidence for is still TODO, and TODO entries are reported and
 * skipped, never inserted.
 *
 * Only events the society hosted or co-hosted are here. Partner societies'
 * own evenings - PakSoc's Zohaib Kazi talk, their Urdu Language Series - are in
 * the Instagram archive but are not ours to list.
 *
 * Times are the London wall clock. An entry whose `startsAt` is a bare date
 * (`2025-10-12`) is stored with `showTime` false and the site shows the date
 * alone. Add a time - making it `2025-10-12T19:00` - and the time appears.
 */

/** Marks a field nobody has confirmed yet. The importer refuses these. */
export const TODO = "TODO";

export type PastEventInput = {
  title: string;
  /** Optional Urdu title, shown in Nastaliq beside the English. */
  titleUrdu?: string;
  /**
   * What shape the evening took. Whether a partner society was involved is a
   * separate question - see `collaborators`.
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
  /** One sentence - used on cards and in search results. */
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
  /**
   * The poster the committee published for the evening.
   *
   * `file` names an image in scripts/data/instagram/, archived by
   * `npm run instagram:archive`; `npm run blob:upload` puts it in Blob storage
   * and the importer then sets `posterUrl` from the result. Posters belonging
   * to a partner society are deliberately absent - PakSoc's artwork is not
   * ours to republish.
   *
   * `alt` is required alongside it, and describes the poster rather than
   * repeating the title: the postcard already prints the title underneath, and
   * the poster is the only place some evenings state their guest or their room.
   *
   * The file also decides where the event links to: the importer reads the
   * permalink of the post the picture came from out of the archive manifest,
   * and the event row links to it. Only our own posts, which is why the
   * partner societies' artwork being absent costs nothing here either.
   */
  poster?: { file: string; alt: string };
  /** Which term this belongs to. Not shown on the site. */
  term: string;
  /** How this was confirmed. Not shown on the site. */
  source: string;
  /**
   * The slug this entry used to have, when a correction has changed its title
   * or its date.
   *
   * Slugs carry the date, so renaming an event or moving it by a week gives it
   * a new one - and the importer inserts by slug, which on a database that
   * already holds the old row would quietly produce two copies of the same
   * evening. Naming the old slug here lets the importer rename the existing row
   * instead. Drop the field once every database has been through it.
   */
  supersedes?: string;
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

/** Cites an Instagram post. The permalink outlives the picture it carried. */
function ig(
  shortCode: string,
  note?: string,
  account = "cambridgeurdusoc",
): string {
  const where = `Instagram @${account} - https://www.instagram.com/p/${shortCode}/`;
  return note ? `${where} (${note})` : where;
}

const LENT_2022 = "Lent 2022";
const EASTER_2022 = "Easter 2022";
const MICHAELMAS_2022 = "Michaelmas 2022";
const LENT_2023 = "Lent 2023";
const EASTER_2023 = "Easter 2023";
const MICHAELMAS_2023 = "Michaelmas 2023";
const LENT_2024 = "Lent 2024";
const MICHAELMAS_2025 = "Michaelmas 2025";
const LENT_2026 = "Lent 2026";
const CARD_M = "Michaelmas 2025 term card (committee)";
const CARD_L = "Lent 2026 term card (committee)";

export const pastEvents: PastEventInput[] = [
  /* Lent 2022 - the society's first term ----------------------------------- */

  {
    title: "Guftagu - Launch Event",
    titleUrdu: "گفتگو",
    kind: "social",
    summary:
      "The society's first event: snacks, poetry and a conversation about what an Urdu society at Cambridge should be.",
    body: [
      "Guftagu - conversation - launched the Cambridge University Urdu Society three",
      "weeks after the account opened. The invitation asked people to come for chilled",
      "vibes and snacks, to read some poetry, to find out how to get involved, and to",
      "say what they wanted the society to become. Everyone was welcome.",
    ].join("\n"),
    poster: {
      file: "2022-02-25-CaaWrVVrX2y-01.jpg",
      alt: "Poster for Guftagu, the society's launch event: an engraved hand holding a reed pen, the date 02.03.22, and the Murray Edwards College bar, 6pm to 9pm.",
    },
    startsAt: "2022-03-02T18:00",
    venue: "Murray Edwards College Bar",
    term: LENT_2022,
    source: ig("CaaWrVVrX2y", "date, venue and 6–9pm from the poster"),
  },

  /* Easter 2022 ------------------------------------------------------------ */

  {
    title: "Ghazal Night Social",
    titleUrdu: "شامِ غزل محفل",
    kind: "social",
    category: "cultural",
    summary:
      "Gup-shup and ghazals: a relaxed evening with a reading in the second half, for anything you cared to bring.",
    body: [
      "People were asked to bring a favourite ghazal, a piece of shayari, or something",
      "of their own for the second half of the night. Urdu and English were both",
      "welcome.",
    ].join("\n"),
    poster: {
      file: "2022-04-30-Cc_FUN_oTeI-01.jpg",
      alt: "Poster for the Ghazal Night Social: a full moon in a dusk-pink sky, headed شامِ غزل محفل, with Friday 6th May, 18:00 to 19:45, Downing College.",
    },
    startsAt: "2022-05-06T18:00",
    venue: "Downing College JCR",
    term: EASTER_2022,
    source: ig("Cc_FUN_oTeI", "and the Easter 2022 term card, ig Cc0qH1_oKBN"),
  },
  {
    title: "Piyam-e-Iqbal - In Conversation with Zirrar Ali",
    titleUrdu: "پیامِ اقبال",
    kind: "talk",
    summary:
      "Zirrar Ali on the poetry, philosophy and legacy of Allama Iqbal, followed by a Q&A.",
    body: [
      "Demand was high enough that the committee asked people to sign up for the",
      "in-person event, and livestreamed the talk on Instagram for everyone else.",
      "",
      "The discussion was followed by a chance to buy Zirrar's translation of Iqbal,",
      "'Ghazi and the Garden', which draws on Bang-e-Dra and Bal-e-Jibreel as well as",
      "the Persian ghazals of Zabur-e-Ajam.",
    ].join("\n"),
    // Neither the term card nor the caption gives an hour; the poster does.
    poster: {
      file: "2022-05-07-CdQNWHkozO4-01.jpg",
      alt: "Poster for Piyam-e-Iqbal: a figure sitting cross-legged beneath an enormous calligraphic inscription on a stone wall, with Saturday 14th May, 16:00 to 18:00, Newnham College.",
    },
    startsAt: "2022-05-14T16:00",
    venue: "Sidgwick Hall, Newnham College",
    term: EASTER_2022,
    source: ig("CdQNWHkozO4", "and the Easter 2022 term card, ig Cc0qH1_oKBN"),
  },
  {
    title: "Bazm-e-Adab - Manto's 'Naya Qanoon'",
    titleUrdu: "بزمِ ادب افسانے",
    kind: "workshop",
    category: "cultural",
    summary:
      "The first Adabi Baithak: a reading of Saadat Hasan Manto's short story 'Naya Qanoon', followed by a screening of Manto (2018).",
    poster: {
      file: "2022-05-17-CdqrGaXtcZq-01.jpg",
      alt: "Poster for the Manto reading circle and film screening: a faded photograph of Saadat Hasan Manto with a pencil at his lips, titled in Urdu, with Friday 20th May, 19:00 to 21:00, Clare College.",
    },
    startsAt: "2022-05-20T19:00",
    venue: "Blythe Room, Clare College (Castle Hill)",
    term: EASTER_2022,
    source: ig("CdqrGaXtcZq", "date, 19:00–21:00 and college from the poster"),
  },
  {
    title: "Bazm-e-Adab - Shayari",
    titleUrdu: "بزمِ ادب شاعری",
    kind: "mushaira",
    kindUrdu: "محفل",
    summary:
      "The year's last poetry reading circle, in the gardens: sher-o-shayari, gup-shup and a rest after a long term.",
    poster: {
      file: "2022-06-05-CebjDndIi5v-01.jpg",
      alt: "Poster for the poetry reading circle: sunset clouds in pink and gold, headed بزمِ ادب شاعری, with Saturday 11th June, 19:00 to 21:00, Selwyn College Gardens.",
    },
    startsAt: "2022-06-11T19:00",
    venue: "Selwyn College gardens",
    term: EASTER_2022,
    source: ig("CebjDndIi5v", "date, 19:00–21:00 and gardens from the poster"),
  },

  /* Michaelmas 2022 -------------------------------------------------------- */

  {
    title: "Welcome Social",
    titleUrdu: "خوش آمدید",
    kind: "social",
    summary: "Snacks and gup-shup about Urdu, to open the year.",
    poster: {
      file: "2022-09-29-CjF5FEBI2kN-01.jpg",
      alt: "Poster for the welcome social: a pale pink and lilac sky headed خوش آمدید, with Thursday 6th October, 18:00 to 20:00, Downing College JCR.",
    },
    startsAt: "2022-10-06T18:00",
    venue: "Downing College JCR",
    term: MICHAELMAS_2022,
    source: ig("CjF5FEBI2kN", "and the Michaelmas 2022 term card, ig Ci8TlBToxw3"),
  },
  {
    title: "Andaaz-e-Bayaan: Ghalib, Ghazal, Masnavi, and I",
    kind: "talk",
    summary:
      "Writer, translator and academic Maaz bin Bilal on the work of Ghalib.",
    poster: {
      file: "2022-10-03-CjQluFTIGFA-01.jpg",
      alt: "Poster for the Maaz bin Bilal speaker event: a vintage typewriter with a blank sheet in the carriage, the society's roundel above, and the talk title, Saturday 15th October at 4pm, marked a virtual event.",
    },
    startsAt: "2022-10-15T16:00",
    venue: "Online",
    term: MICHAELMAS_2022,
    source: ig("CjQluFTIGFA", "and the Michaelmas 2022 term card, ig Ci8TlBToxw3"),
  },
  {
    title: "Sham-e-Gham - Mehfil-e-Zaban-Urdu",
    titleUrdu: "شامِ غم",
    kind: "workshop",
    summary:
      "The first of a series of multimedia workshops on Iqbal, Urdu language, adab and shayari - grief with Iqbal.",
    body: "All were welcome, whatever their level of Urdu.",
    poster: {
      file: "2022-11-06-Ckn-VaxI6Zf-01.jpg",
      alt: "Poster for Sham-e-Gham: a sepia photograph of Allama Iqbal resting his head on one hand, with the workshop title in Urdu and English and the Blythe Room, Clare College, 9th November, 6pm.",
    },
    startsAt: "2022-11-09T18:00",
    venue: "Blythe Room, Clare College (Castle Hill)",
    term: MICHAELMAS_2022,
    source: ig("Ckn-VaxI6Zf", "date, time and room from the poster"),
  },
  {
    title: "An Evening with Amjad Islam Amjad",
    kind: "talk",
    summary:
      "The poet Amjad Islam Amjad - columnist, translator, dramatist, and above all a writer of nazms - in conversation, open to all.",
    body: [
      "Amjad Islam Amjad held the Allama Muhammad Iqbal Award, the Pride of",
      "Performance and the Sitara-e-Imtiaz. He read two new ghazals that evening. He",
      "died in February 2023, and the society posted both readings as a tribute -",
      "they are the only recording of the night that survives.",
      "",
      "The virtual event was followed by an open mic in Cambridge.",
    ].join("\n"),
    poster: {
      file: "2022-11-24-ClWZC8So0P8-01.jpg",
      alt: "Poster for the Amjad Islam Amjad speaker event: a pale portrait of the poet behind the text, an open book of Urdu verse in the corner, and the 3 to 4pm GMT Zoom talk followed by an open mic.",
    },
    startsAt: "2022-11-27T15:00",
    venue: "Online",
    term: MICHAELMAS_2022,
    source: ig("ClWZC8So0P8", "tribute post with the readings: ig CoeVzG1AvEC"),
  },

  /* Lent 2023 -------------------------------------------------------------- */

  {
    title: "Welcome Social",
    titleUrdu: "خوش آمدید",
    kind: "social",
    summary: "Shayari, good music and better company, to open the term.",
    startsAt: "2023-01-27T18:00",
    venue: "Gatehouse Room, Clare College (Memorial Court)",
    term: LENT_2023,
    source: ig("CnwVNyvIMGN", "Lent 2023 term card"),
  },
  {
    title: "UrduSoc × PakSoc Mushaira - Open Mic Night",
    titleUrdu: "مشاعرہ",
    kind: "mushaira",
    collaborators: ["PakSoc"],
    summary:
      "The two societies' first collaboration: an open mic for poetry, ghazals and songs in any language, your own or someone else's.",
    body: "The floor was opened for spontaneous performances at the end.",
    startsAt: "2023-02-17T19:00",
    venue: "Queens Lecture Theatre, Emmanuel College",
    term: LENT_2023,
    source: ig("CofaDYwO3wH", "poster: 17.02.23, 7–9pm", "cambridge_paksoc"),
  },
  {
    title: "Matnsaz: Designing a New Urdu Keyboard",
    kind: "talk",
    summary:
      "Zeerak Ahmed - designer, engineer and writer from Lahore - on building Matnsaz, a new Urdu keyboard.",
    body: [
      "Ahmed designs Urdu technology under Matnsaz and writes about Pakistani pop",
      "music. The event was open to everyone in the UK and beyond.",
    ].join("\n"),
    // The poster says "Saturday 5th March"; 5 March 2023 was a Sunday. The
    // society's own recap, posted that day, says the talk was "today", so the
    // date is right and the weekday on the artwork is a slip.
    poster: {
      file: "2023-02-18-CoztXu0oxh_-01.jpg",
      alt: "Poster for the Zeerak Ahmed talk: a phone showing a message thread in English and Urdu above an Urdu keyboard, captioned Matnsaz, a breakthrough Urdu keyboard.",
    },
    startsAt: "2023-03-05T16:00",
    venue: "Online",
    term: LENT_2023,
    source: ig("CoztXu0oxh_", "recap posted on the day: ig CpajmZxAAqX"),
  },

  /* Easter 2023 ------------------------------------------------------------ */

  {
    title: "Welcome Social",
    titleUrdu: "خوش آمدید",
    kind: "social",
    summary:
      "Activities, snacks and poetry, and a way into the society for anyone new.",
    // The term card reads "Friday 30th April"; 30 April 2023 was a Sunday, and
    // the poster says Sunday, so the weekday on the card was the slip.
    poster: {
      file: "2023-04-25-CreJy_ZrFtv-01.jpg",
      alt: "Poster for the welcome social: a gold Urdu خوش آمدید inside an ornamental border on violet, with Sunday 30th April, 18:00 to 21:00, the Bennett Room, Clare College Memorial Court.",
    },
    startsAt: "2023-04-30T18:00",
    venue: "Bennett Room, Clare College Memorial Court",
    term: EASTER_2023,
    source: ig("CreJy_ZrFtv", "date, 18:00–21:00 and room from the poster"),
  },
  {
    title: "In Conversation with Aqib Sabir",
    kind: "talk",
    summary:
      "The poet, researcher and translator Aqib Sabir, one of the young Indian poets who rose with the digital turn in Urdu poetry.",
    body: [
      "Sabir has featured in poetry symposia across north India and has been published",
      "in journals, web portals and anthologies. He was then reading for a PhD in the",
      "Department of English at Jamia Millia Islamia, New Delhi. The event was open to",
      "everyone, anywhere.",
    ].join("\n"),
    poster: {
      file: "2023-04-28-CrlUHirsUb8-01.jpg",
      alt: "Poster for the Aqib Sabir speaker event: a black and white photograph of the poet at a microphone, his name in English and Urdu, and the Zoom times in BST, PKT and IST.",
    },
    startsAt: "2023-05-06T16:00",
    venue: "Online",
    term: EASTER_2023,
    source: ig("CrlUHirsUb8", "and the Easter 2023 term card, ig CrJJ1hVMmoZ"),
  },
  {
    title: "Movie Night - Kamli",
    titleUrdu: "کملی",
    kind: "social",
    category: "cultural",
    summary: "A screening of Sarmad Khoosat's Kamli, with snacks.",
    poster: {
      file: "2023-05-03-CrxiXFWLvBw-01.jpg",
      alt: "Poster for the Kamli screening: a still of three women beneath a flowering amaltas tree, with Tuesday 9th May, 6 to 9pm, St John's Divinity School lecture theatre.",
    },
    startsAt: "2023-05-09T18:00",
    venue: "St John's Divinity School Lecture Theatre",
    term: EASTER_2023,
    source: ig("CrxiXFWLvBw", "and the Easter 2023 term card, ig CrJJ1hVMmoZ"),
  },
  {
    title: "Poetry on the River",
    titleUrdu: "دریائے کیمبرج پر شاعری",
    kind: "mushaira",
    summary:
      "The year's last event, read from three punts on the Cam - eighteen places, and everyone asked to bring their shayari.",
    body: [
      "Self-hired punts, booked by the society. Tickets were £6, or £2 for anyone",
      "willing to take a turn punting. Snacks were provided.",
    ].join("\n"),
    poster: {
      file: "2023-06-08-CtO-PIgM4KQ-01.jpg",
      alt: "Poster for Poetry on the River: a punt of passengers passing under the Bridge of Sighs at St John's, titled in English and Urdu, with 17th June, 5 to 8pm, Cripps Quay.",
    },
    startsAt: "2023-06-17T17:00",
    venue: "St John's Cripps Court moorings, River Cam",
    term: EASTER_2023,
    source: ig("CtO-PIgM4KQ"),
  },

  /* Michaelmas 2023 -------------------------------------------------------- */

  {
    title: "Welcome Social - Charades in Urdu",
    titleUrdu: "خوش آمدید",
    kind: "social",
    summary:
      "Drinks, snacks and a game of charades in Urdu, for all levels of speaker.",
    poster: {
      file: "2023-10-11-CyRVcSxr_KN-01.jpg",
      alt: "Poster for the welcome social: a detail of a Mughal miniature, figures in patterned robes on a red carpet, headed خوش آمدید, with Tuesday 17th October, 17:00 to 19:30, Student Union Lounge.",
    },
    startsAt: "2023-10-17T17:00",
    venue: "Student Union Lounge",
    term: MICHAELMAS_2023,
    source: ig("CyRVcSxr_KN", "date, 17:00–19:30 and venue from the poster"),
  },
  {
    title: "Mehfil - Reading Circle",
    titleUrdu: "محفل",
    kind: "mushaira",
    summary:
      "Poetry read and discussed together - participate or just listen in, at any level of Urdu.",
    poster: {
      file: "2023-11-01-CzGymDrM7SM-01.jpg",
      alt: "Poster for the reading circle: a Mughal miniature of a ruler enthroned among courtiers, headed محفل, with Sunday 5th November, 17:00 to 19:00, Student Union Lounge.",
    },
    startsAt: "2023-11-05T17:00",
    venue: "Student Union Lounge",
    term: MICHAELMAS_2023,
    source: ig("CzGymDrM7SM", "date, 17:00–19:00 and venue from the poster"),
  },
  {
    title: "Iqbal Day with Dr Amar Sohal",
    kind: "talk",
    summary:
      "Dr Amar Sohal on Iqbal's poetry and politics, marking a belated Iqbal Day.",
    poster: {
      file: "2023-11-22-Cz85znKi4Di-01.jpg",
      alt: "Poster for Iqbal Day: a large tinted portrait of Allama Iqbal in profile, with Dr Amar Sohal's talk on his poetry and politics, the Student Union Lounge, 27th November 2023, 5pm.",
    },
    startsAt: "2023-11-27T17:00",
    venue: "Student Union Lounge",
    term: MICHAELMAS_2023,
    source: ig("Cz85znKi4Di"),
  },

  /* Lent 2024 -------------------------------------------------------------- */

  {
    title: "Movie Night - Zindagi Tamasha",
    titleUrdu: "زندگی تماشہ",
    kind: "social",
    category: "cultural",
    summary:
      "A screening of Sarmad Khoosat's Zindagi Tamasha, with English subtitles and snacks.",
    poster: {
      file: "2024-01-29-C2sOYs6iV_t-01.jpg",
      alt: "Poster for the Zindagi Tamasha screening: the film's image of an older man in a red shawl, the title in Urdu and English, and Saturday 10th February, 18:00, John's Divinity School main lecture theatre.",
    },
    startsAt: "2024-02-10T18:00",
    venue: "St John's Divinity School Main Lecture Theatre",
    term: LENT_2024,
    source: ig("C2sOYs6iV_t", "date, time and venue from the poster"),
  },
  {
    title: "Faiz Ahmed Faiz - Reading Circle",
    titleUrdu: "فیض احمد فیض",
    kind: "mushaira",
    summary:
      "Faiz's birthday, marked by reading and discussing his poems - favourites welcome, no prior knowledge needed.",
    poster: {
      file: "2024-02-12-C3QgRoML4zM-01.jpg",
      alt: "Poster for the Faiz Ahmed Faiz reading circle: his name in Urdu and English over a yellow wash, a photograph of guests on steps below, and Saturday 17th February, 6:30 to 8pm, Student Union Lounge.",
    },
    startsAt: "2024-02-17T18:30",
    venue: "Student Union Lounge",
    term: LENT_2024,
    source: ig("C3QgRoML4zM", "date, 6:30–8pm and venue from the poster"),
  },
  {
    title: "Ghazal & the History of the Urdu Language",
    titleUrdu: "غزل اور اردو زبان کی تاریخ",
    kind: "talk",
    summary:
      "The Pakistani-American poet and translator Shadab Zeest Hashmi on the ghazal and its part in the making of Urdu itself.",
    body: [
      "Billed for anyone who hadn't the slightest idea what a ghazal was, as much as",
      "for those who had been through the whole of Iqbal Bano's catalogue.",
    ].join("\n"),
    poster: {
      file: "2024-02-19-C3ijpojLyGA-01.jpg",
      alt: "Poster for the Shadab Zeest Hashmi talk: her photograph beside a short biography over a faded floral pattern, with the title in Urdu and English and Saturday 2nd March, 6 to 8pm, Student Union Lounge.",
    },
    startsAt: "2024-03-02T18:00",
    venue: "Student Union Lounge",
    term: LENT_2024,
    source: ig("C3ijpojLyGA", "date, 6–8pm and venue from the poster"),
  },

  /* Michaelmas 2025 -------------------------------------------------------- */

  {
    title: "Chai and Chat!",
    kind: "social",
    summary: "Freshers' event - meet the committee.",
    poster: {
      file: "2025-10-10-DPocvcsDTkA-01.jpg",
      alt: "Poster for Chai and Chat: a painted scene of hands passing cups of chai, framed as a polaroid on a carpet, with 12th October, 5 to 8pm, the Munby Room at King's College.",
    },
    startsAt: "2025-10-12T17:00",
    venue: "Munby Room, King's College",
    term: MICHAELMAS_2025,
    source: `${CARD_M}; time and room from the poster, ${ig("DPocvcsDTkA")}`,
  },
  {
    title: "South Asian Cambridge Walk",
    kind: "social",
    category: "cultural",
    collaborators: ["PakSoc"],
    summary: "A walk through South Asian Cambridge, with PakSoc.",
    // The card reads "OCT TBC" - no date was ever printed, and the Instagram
    // archive has no post for it. Not to be confused with the Cambridge South
    // Asia Tour of January 2026, which is a different walk in a different term.
    startsAt: TODO,
    term: MICHAELMAS_2025,
    source: CARD_M,
  },
  {
    title: "Jinn-o-ween",
    kind: "mushaira",
    category: "cultural",
    summary:
      "An evening of horror stories from South Asia and beyond - jinns, churails, and whatever else you brought.",
    body: "Sit in the circle, bring the horror stories; the committee brought the snacks.",
    poster: {
      file: "2025-10-23-DQKOMnIDQBb-01.jpg",
      alt: "Poster for Jinn-o-ween: a red skull above an engraving of King's College at night, with 26/10, King's College Munby Room, 6 to 8pm, and a line promising horror stories from South Asia and beyond.",
    },
    startsAt: "2025-10-26T18:00",
    venue: "Munby Room, King's College",
    term: MICHAELMAS_2025,
    source: `${CARD_M}; time and room from the poster, ${ig("DQKOMnIDQBb")}`,
  },
  {
    title: "Mushaira - Iqbal Day",
    kind: "mushaira",
    kindUrdu: "محفل",
    summary:
      "A mushaira for Iqbal Day: favourite poets read aloud, and the floor open to your own poetry, in Urdu or not.",
    body: [
      "Anything was welcome from the floor - an anecdote, a ghazal, a song, a musical",
      "performance.",
      "",
      "The poster gave the Munby Room at King's; the committee moved the evening to",
      "Christ's a few days before.",
    ].join("\n"),
    // The term card says 9 November. The poster says Sunday 16 November, and the
    // post announcing it went up on 11 November, so the card is wrong.
    poster: {
      file: "2025-11-11-DQ6q8gtjU8C-01.jpg",
      alt: "Poster for the Iqbal Day mushaira: a stylised orange and purple portrait of Allama Iqbal beside a fountain pen and King's College Chapel, with Sunday 16th November, 5:30 to 8pm, and the room printed before the move to Christ's.",
    },
    startsAt: "2025-11-16T17:30",
    venue: "Z Amenity Room, Christ's College",
    term: MICHAELMAS_2025,
    source: `${CARD_M}; date corrected from the poster and venue change, ${ig("DQ6q8gtjU8C")}`,
    supersedes: "mushaira-iqbal-day-2025-11-09",
  },
  {
    title: "'Home Away From Home'",
    kind: "workshop",
    summary: "Shayari scrapbooking.",
    // The card reads "NOV TBC", and nothing in the Instagram archive matches it.
    startsAt: TODO,
    term: MICHAELMAS_2025,
    source: CARD_M,
  },
  {
    title: "In Conversation with Ghazal Studio",
    kind: "mushaira",
    category: "cultural",
    collaborators: ["Ghazal Studio"],
    summary:
      "A night of ghazals with Ghazal Studio - live tabla, vocals and a blend of musical traditions. Free and open to all.",
    body: [
      "Guests were asked to wear their best cultural wear and bring friends. An open",
      "mic followed straight after, for anyone who wanted to sing, recite, or tell the",
      "story behind a favourite ghazal.",
      "",
      "Ghazal Studio's own account thanked the singers Nirmal Joshi and Ekta Rana, and",
      "Dhruv Joshi on sound, for a night where 'the young generation of listeners' sang",
      "along.",
    ].join("\n"),
    // The Cambridge listings site advertised "A Musical Night with Ghazal
    // Studio" and the term card "In Conversation with Ghazal Studio". The
    // Instagram announcement and Ghazal Studio's own thank-you post describe one
    // evening on 28 November - talk and performance both - so they were a single
    // event and are kept as one entry.
    poster: {
      file: "2025-11-19-DRPByegjYQm-01.jpg",
      alt: "Poster for the Ghazal Studio evening: the Ghazal Studio logo on black between ornamental borders, three musicians cut out along the bottom, with Friday 28th November, Wolfson Clubroom, 6:30 to 8:30pm.",
    },
    startsAt: "2025-11-28T18:30",
    venue: "Wolfson Clubroom",
    term: MICHAELMAS_2025,
    source: `${CARD_M}; time and venue from ${ig("DRPByegjYQm")}; open mic ${ig("DRcdmsBDTpm")}`,
  },
  {
    title: "Chai and Chat! - End of Term Social",
    kind: "social",
    summary: "End of term social.",
    startsAt: "2025-11-29",
    term: MICHAELMAS_2025,
    source: CARD_M,
  },

  /* Lent 2026 -------------------------------------------------------------- */

  {
    title: "Brunch & Baat-Cheet",
    titleUrdu: "بات چیت",
    kind: "social",
    summary:
      "Brunch and the first speaking class: somewhere to improve your Urdu, or just speak your home language over food.",
    poster: {
      file: "2026-01-19-DTs6Xu4DUN2-01.jpg",
      alt: "Poster for Brunch and Baat-Cheet: a painted spread of eggs, waffles and coffee around a postcard of Chowmahalla Palace, with 12pm, Saturday 24th January, Fitzwilliam College.",
    },
    startsAt: "2026-01-24T12:00",
    venue: "Fitzwilliam College",
    term: LENT_2026,
    source: `${CARD_L}; name, time and venue from the poster, ${ig("DTs6Xu4DUN2")}`,
    supersedes: "urdusoc-brunch-2026-01-24",
  },
  {
    title: "Cambridge South Asia Tour",
    kind: "social",
    category: "cultural",
    summary:
      "A walking tour of the city through the stories of the South Asians who studied here, ending with gelato at Jack's.",
    // The card listed this as "South Asian Tour, WEEK 01" with no date; the
    // poster gives it. The card's "Jack's Social" is the gelato stop at the end
    // of the walk, not a co-hosting society, so no collaborator is recorded.
    poster: {
      file: "2026-01-25-DT8A4pDjTWM-01.jpg",
      alt: "Poster for the Cambridge South Asia Tour: an illustrated map of the city with portraits of South Asian figures placed on the colleges, with 29th January, 2pm, meeting outside King's.",
    },
    startsAt: "2026-01-29T14:00",
    venue: "Meeting outside King's College",
    term: LENT_2026,
    source: `${CARD_L}; date, time and meeting point from the poster, ${ig("DT8A4pDjTWM")}`,
  },
  {
    title: "In-Safar-able: Comic Relief After Grief",
    kind: "workshop",
    collaborators: ["Rawanee Creatives"],
    summary:
      "An Urdu writing workshop and open mehfil with Rawanee Creatives, on humour in Urdu poetry and the art of writing it.",
    body: [
      "The afternoon ended with an open mic for work written there, classic poems, or",
      "anything else people wanted to read.",
      "",
      "The poster gave the Munby Room at King's; the committee moved it to Christ's two",
      "days before.",
    ].join("\n"),
    poster: {
      file: "2026-01-29-DUF-Se5DUYI-01.jpg",
      alt: "Poster for In-Safar-able: a blue linocut of a figure at a desk with one arm raised, with Rawanee Creatives named, Sunday 1st February, 4 to 6pm, and the room printed before the move to Christ's.",
    },
    startsAt: "2026-02-01T16:00",
    venue: "Z Amenity Room, Christ's College",
    term: LENT_2026,
    source: `${CARD_L}; time, host and venue change from ${ig("DUF-Se5DUYI")}`,
    supersedes:
      "urdu-teach-in-workshop-1-in-safar-able-comic-relief-after-grief-2026-02-01",
  },
  {
    title: "Brunch & Baat-Cheet - Speaking Class 2",
    titleUrdu: "بات چیت",
    kind: "social",
    summary: "Brunch and the term's second speaking class, at all levels.",
    // The card says Sunday 8 February. The poster says 12pm, Saturday 7th Feb,
    // as does the post announcing it four days earlier - and the term's other
    // brunch was also a Saturday. The poster wins.
    poster: {
      file: "2026-02-02-DUQWtHBDWGi-01.jpg",
      alt: "Poster for Brunch and Baat-Cheet: a painted spread of pretzels, pie and cinnamon buns around a postcard of a blue car, with 12pm, Saturday 7th Feb, King's College.",
    },
    startsAt: "2026-02-07T12:00",
    venue: "King's College",
    term: LENT_2026,
    source: `${CARD_L}; date corrected from the poster, ${ig("DUQWtHBDWGi")}`,
    supersedes: "urdusoc-brunch-speaking-class-2-2026-02-08",
  },
  {
    title: "The Progressive Writers' Association & Faiz Ahmed Faiz",
    titleUrdu: "ترقی پسند تحریک",
    kind: "workshop",
    summary:
      "An UrduSoc teach-in on resistance through poetry and the legacy of the Progressive Writers' Movement, centred on Faiz.",
    body: "Led by Taha, who had been the society's Language Officer in its first year.",
    poster: {
      file: "2026-02-10-DUmFq44jeaH-01.jpg",
      alt: "Poster for the teach-in: archive photographs of the Progressive Writers' Association and a 1933 police notice banning Angare, with Sunday 15th February, 4 to 6pm, Munby Room, King's College.",
    },
    startsAt: "2026-02-15T16:00",
    venue: "Munby Room, King's College",
    term: LENT_2026,
    source: `${CARD_L}; time and venue from the poster, ${ig("DUmFq44jeaH")}`,
    supersedes:
      "urdu-teach-in-workshop-2-faiz-and-the-progressive-writers-movement-2026-02-15",
  },
  {
    title: "Bazm-e-Yaar: A Night of Desi Voices",
    titleUrdu: "بزمِ یار",
    kind: "mushaira",
    kindUrdu: "محفل",
    collaborators: ["CamSAMS", "Majlis", "PakSoc"],
    summary:
      "An evening of South Asian artistry - student bands, duets, instrumental sets and poetry - in the Hidden Rooms.",
    body: [
      "Billed as a slice of Coke Studio in the heart of Cambridge: soulful duets,",
      "instrumental sets, ghazals, nazms and shers, and special guest performances.",
      "Tickets were £7.50, and performers came free. Two mocktails were mixed for the",
      "night - Raag-e-Ananas and Berry Bandish.",
      "",
      "The term card had it at Clare Cellars; it was held in the Hidden Rooms Lounge.",
    ].join("\n"),
    poster: {
      file: "2026-02-08-DUfxHnTjWF7-01.jpg",
      alt: "Poster for Bazm-e-Yaar: the title in red and gold Urdu calligraphy on a dark paisley ground, with 16th February, 7pm, Hidden Rooms Lounge, and the four societies' badges down one side.",
    },
    startsAt: "2026-02-16T19:00",
    venue: "Hidden Rooms Lounge",
    term: LENT_2026,
    source: `${CARD_L}; date, time, venue and price from ${ig("DUfxHnTjWF7")}; co-hosts named in ${ig("DUc20osiMUm", undefined, "thecambridgemajlis")}`,
  },
  {
    title: "The Indian Caliphate: Poetry, Power, and Exile",
    kind: "talk",
    summary: "In conversation with Imran Mulla.",
    // The card reads "WEEK 04", and nothing in the Instagram archive matches it.
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
    title: "UrduSoc Games Night + Iftar",
    kind: "social",
    summary:
      "Urdu-language games and refreshments after iftar, in the first week of Ramadan.",
    // The card listed this as "WEEK 03" with no date; the poster gives it.
    poster: {
      file: "2026-02-28-DVULuoTjYly-01.jpg",
      alt: "Poster for the games night and iftar: peonies and carpet borders framing handwritten text, with 2nd March, the Gatsby Room at Wolfson College, 7:30 to 10pm.",
    },
    startsAt: "2026-03-02T19:30",
    venue: "Gatsby Room, Wolfson College",
    term: LENT_2026,
    source: `${CARD_L}; date, time and venue from the poster, ${ig("DVULuoTjYly")}`,
  },
  {
    title: "Iftar Potluck - Speaking Class 4",
    kind: "social",
    summary: "Iftar potluck, with Speaking Class 4.",
    startsAt: "2026-03-08",
    term: LENT_2026,
    source: CARD_L,
  },
  {
    title: "The Enduring Legacy of Allama Iqbal",
    kind: "talk",
    summary:
      "Walid Iqbal - lawyer, law professor, former Senator, and grandson of Allama Iqbal - on his life, his career and his grandfather's legacy, followed by a Q&A.",
    body: "On neither term card: arranged after the card was printed.",
    poster: {
      file: "2026-03-03-DVbyuUXDdZ1-01.jpg",
      alt: "Poster for the Walid Iqbal talk: a wax seal and a quill on dark red brocade, a portrait of Allama Iqbal in the corner, and 10 March 2026, 1:15pm, Judge Business School, Lecture Theatre 1.",
    },
    startsAt: "2026-03-10T13:15",
    venue: "Lecture Theatre 1, Judge Business School",
    term: LENT_2026,
    source: ig("DVbyuUXDdZ1", "date, time and venue from the poster"),
  },
  {
    title: "End of Term Social: Shayari Scrapbooking",
    kind: "social",
    summary: "End of term social - shayari scrapbooking.",
    startsAt: "2026-03-15",
    term: LENT_2026,
    source: CARD_L,
  },
];
