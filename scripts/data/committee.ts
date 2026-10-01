/**
 * Every committee the society has had, for import by
 * `npm run db:import-committee`.
 *
 * Transcribed from the "meet the committee" posts on the society's Instagram,
 * scraped on 1 October 2026 (see scripts/data/instagram/). Those posts are the
 * only record of the earlier committees that exists anywhere: there is no
 * minute book, and the first two years are now four years gone.
 *
 * WHAT IS AND IS NOT HERE
 *
 * Full names, read off the announcement cards themselves - the captions gave
 * only first names, but every card prints the officer's full name across the
 * top, and the 2025–26 and 2026–27 cards print it in Urdu as well. Those Urdu
 * names are the `nameUrdu` values; the 2022 and 2023 cards give the role in
 * Urdu but not the name, so those entries have none.
 *
 * Where a caption described someone in prose, the description is kept as a bio
 * in their own announcement's words, minus the pronouns - nobody here has
 * stated theirs, and an archive should not guess on anyone's behalf. The direct
 * quotes from 2022, where each new officer was asked why they joined, are
 * reproduced verbatim.
 *
 * College names are normalised to the college's own name, so the colloquial
 * "Medwards" of a caption is stored as Murray Edwards. Years of study are not
 * stored: `committee` has no column for them, and they would be a half-truth in
 * an archive organised by year. They are in the Instagram captions if anyone
 * wants them.
 *
 * HOW THE YEARS ARE LABELLED
 *
 * By the academic year each committee actually ran, which is not always the
 * year it was announced. The founding committee was announced in April 2022 but
 * ran the society from its launch that March through Lent 2023, so it is filed
 * under 2022–23; the committee announced in April 2023 ran through Lent 2024
 * and is filed under 2023–24. Nothing was posted for 2024–25 - the society was
 * dormant, and the April 2025 post opens "Urdu Soc is coming back this term" -
 * so that year is deliberately absent rather than invented.
 */

export type CommitteeMemberInput = {
  /** Full name, as printed on the announcement card. */
  name: string;
  /** The Urdu spelling, where the card printed one. */
  nameUrdu?: string;
  /**
   * Free text, matching the wording of the announcement. Roles genuinely
   * change between committees, and two people may hold the same one.
   */
  role: string;
  /** Shown on /committee for the current year only. */
  bio?: string;
  college?: string;
  course?: string;
  /**
   * A role the committee has advertised but not yet filled. Imported as the
   * same "To be announced" placeholder the seed uses, so the roster shows the
   * shape of the committee and the gap in it.
   */
  vacant?: boolean;
};

export type CommitteeYearInput = {
  /** e.g. "2026–27". En dash, two-digit second year. */
  academicYear: string;
  /** Exactly one year should be current. */
  isCurrent: boolean;
  /** A line of context, shown beside the roster in the archive. */
  note?: string;
  /** Where this came from. Not shown on the site. */
  source: string;
  /** In the order they should appear. Order here becomes `orderIndex`. */
  members: CommitteeMemberInput[];
};

/** Cites an Instagram post. */
function ig(shortCode: string): string {
  return `https://www.instagram.com/p/${shortCode}/`;
}

export const committeeYears: CommitteeYearInput[] = [
  {
    academicYear: "2022–23",
    isCurrent: false,
    note: "The founding committee. The society opened its account in February 2022 and launched with Guftagu at Murray Edwards on 2 March; this roster was announced that April, each officer asked why they had joined.",
    source: `Instagram @cambridgeurdusoc, 12–13 April 2022 - ${ig("CcSpCpYNWGj")} and the nine posts around it`,
    members: [
      {
        name: "Hassan Aftab",
        role: "President",
        college: "Selwyn",
        course: "PhD, Earth Sciences",
        bio: "‘To appreciate the beauty of Urdu and emphasise how using it aesthetically makes it a work of art.’",
      },
      {
        name: "Hanniya Kamran",
        role: "Vice-President",
        college: "Murray Edwards",
        course: "Architecture",
        bio: "‘This society stemmed from a desire to understand and connect with my culture and language, which I feel I wasn’t able to fully appreciate growing up. I hope this can become a space where we can learn from one another and collectively deepen our knowledge and understanding of what Urdu has to offer.’",
      },
      {
        name: "Mahwish Arif",
        role: "General Secretary",
        college: "Hughes Hall",
        course: "PhD, Computer Science",
        bio: "‘For the love of language and connect with those who share this love.’",
      },
      {
        name: "Samiha Hussain",
        role: "Treasurer",
        college: "Gonville & Caius",
        course: "Law",
        bio: "‘We founded this society to create a platform for students to facilitate their growing interest in Urdu language, literature, culture and its history. Urdu being such a beautiful language, it automatically lends itself to having very deep-rooted poetry.’",
      },
      {
        name: "Taha Firdous Shah",
        role: "Language Officer",
        // The announcement gave no college for this one.
        course: "MPhil, Modern South Asian Studies",
        bio: "‘The language of love, urdu zabaan is an open call for a ‘bazm’ of lovers, those who have failed in love or are in love, finding love. The way, and all the meanings held within it, that it embraces the person in frenzy makes it all the more attractive for one to not love this language. Hence, the lost self is also trying to find meaning in the midst of chaos and desolation.’",
      },
      {
        name: "Abeer Qureshi",
        role: "Poetry Officer",
        college: "Lucy Cavendish",
        course: "English",
        bio: "‘As a literature student who has never traced Urdu words or seen an Urdu author in the curriculum, I want to connect with my roots again, and learn to have the same love for the language that my ancestors had.’",
      },
      {
        name: "Fazal-E-Momin Syed",
        role: "Poetry Officer",
        college: "Downing",
        course: "Medicine",
        bio: "‘Urdu poetry is half my personality.’",
      },
      {
        name: "Aatqa Arham",
        role: "Graphics and Publicity Officer",
        college: "Newnham",
        course: "Medicine",
        bio: "‘To improve my language abilities, in particular my reading and writing :) I’m looking forward to meet and hang out with people who are interested in the beauty of the Urdu and the cultures and histories associated with it!’",
      },
      {
        name: "Sobaan Mohammed",
        role: "Content and Media Officer",
        college: "Selwyn",
        course: "Education",
        bio: "‘To share my love for Urdu poetry and music and of course the language itself! There really was a golden age of Urdu literature that sadly most young people don’t know about, so I hope to shed some light on this and some of the famous poets and singers of the past.’",
      },
      {
        name: "Savannah Phillips",
        role: "Content and Media Officer",
        college: "Magdalene",
        course: "Philosophy of Science",
        bio: "‘I love how poetic Urdu is as a language, as well as the history of it and how it diverged from the proto-Indo-European language. I went to school in Birmingham where many of my friends speak Urdu and it’s so nice when I surprise their parents with a lil bit of Urdu skills!’",
      },
    ],
  },

  {
    academicYear: "2023–24",
    isCurrent: false,
    note: "Announced in April 2023, with Hassan, Mahwish and Samiha staying on for a second year. This was the committee that ran the Aqib Sabir reading, the punts on the Cam, and the Shadab Zeest Hashmi evening.",
    source: `Instagram @cambridgeurdusoc, 30 April 2023 - ${ig("CrqPjiPMc5z")} and the seven posts around it`,
    members: [
      {
        name: "Hassan Aftab",
        role: "President",
        college: "Selwyn",
        course: "PhD, Earth Sciences",
        bio: "From Lahore; particularly enjoys Urdu short stories and is fond of Urdu poetry.",
      },
      {
        name: "Hader Aziz",
        role: "Vice-President",
        college: "Hughes Hall",
        course: "Law",
        bio: "From Islamabad.",
      },
      {
        name: "Mahwish Arif",
        role: "General Secretary",
        college: "Hughes Hall",
        course: "PhD, Computer Science",
        bio: "Particularly interested in Urdu humour (مزاح); favourite humourists are Shafiq ur Rehman and Ibn-e-Insha. Continuing in the role from the founding committee.",
      },
      {
        name: "Samiha Hussain",
        role: "Treasurer",
        college: "Gonville & Caius",
        course: "Law",
        bio: "Urdu being such a beautiful language, it lends itself to having very deep-rooted poetry.",
      },
      {
        name: "Zayna Mian",
        role: "Language Officer",
        college: "Trinity",
        course: "Psychology",
        bio: "From Lahore.",
      },
      {
        name: "Adil Mian",
        role: "Workshop and Design Officer",
        college: "Queens'",
        course: "Physics",
        bio: "From Karachi.",
      },
      {
        name: "Faizan Soofi",
        role: "Poetry Officer",
        college: "Peterhouse",
        course: "English",
        bio: "From Lahore.",
      },
      {
        name: "Aalim Akhtar",
        role: "Poetry Officer",
        // "A PhD candidate at the English Department" - no college given.
        course: "PhD, English",
        bio: "From Delhi; a translator, and composes poetry in Urdu.",
      },
    ],
  },

  {
    academicYear: "2025–26",
    isCurrent: false,
    note: "The committee that restarted the society after a quiet year, announced in July 2025 and joined by a Design Officer that September. Hanniya, the founding Vice-President, came back as President.",
    source: `Instagram @cambridgeurdusoc, 2–3 July and 26 September 2025 - ${ig("DLnqdpItsYQ")} and the seven posts around it`,
    members: [
      {
        name: "Hanniya Kamran",
        nameUrdu: "ہانیہ کامران",
        role: "President",
        college: "Murray Edwards",
        course: "Architecture",
      },
      {
        name: "Imaan Haider",
        nameUrdu: "ایمان حیدر",
        role: "Vice-President",
        college: "Wolfson",
        course: "Graduate Medicine",
      },
      {
        name: "Simone Khan",
        nameUrdu: "سیمون خان",
        role: "Secretary",
        college: "Pembroke",
        course: "Economics",
      },
      {
        name: "Awais Nawab Ali",
        nameUrdu: "اویس نواب علی",
        role: "Treasurer",
        college: "Fitzwilliam",
        course: "PhD",
      },
      {
        name: "Daheem Khan",
        nameUrdu: "دہیم خان",
        role: "Events Officer",
        college: "King's",
        course: "Law",
      },
      {
        name: "Ruhi Amir Alam",
        nameUrdu: "روحی عامر عالم",
        role: "Events Officer",
        college: "Wolfson",
        course: "Master's",
      },
      {
        // Not a duplicate of the Vice-President above: two people named Imaan
        // sat on this committee, at different colleges - Imaan Haider and
        // Imaan Awan, as their own cards spell them.
        name: "Imaan Awan",
        nameUrdu: "ایمان اعوان",
        role: "Publicity Officer",
        college: "Murray Edwards",
        course: "Medicine",
      },
      {
        name: "Mohammad Zaid",
        nameUrdu: "محمد زید",
        role: "Design Officer",
        college: "Trinity",
        course: "PhD",
      },
    ],
  },

  {
    academicYear: "2026–27",
    isCurrent: true,
    source: `Instagram @cambridgeurdusoc, 28 September 2026 - ${ig("Dd1P2CmjVA1")} and the three posts around it`,
    members: [
      {
        name: "Zayna Mian",
        nameUrdu: "زینہ میاں",
        role: "President",
        college: "Trinity",
        course: "PhD, Psychology",
      },
      {
        name: "Aahad Saddat",
        nameUrdu: "احد سعادت",
        role: "Vice-President",
        college: "St Edmund's",
        course: "Land Economy",
      },
      {
        name: "Abdullah Akram",
        nameUrdu: "عبداللہ اکرم",
        role: "Secretary",
        college: "Homerton",
        course: "Computer Science",
      },
      {
        name: "Daheem Khan",
        nameUrdu: "دہیم خان",
        role: "Treasurer",
        college: "King's",
        course: "Law",
      },
      // Advertised as open in the announcement posts of 28 September 2026.
      { name: "", role: "Events Officer", vacant: true },
      { name: "", role: "Publicity Officer", vacant: true },
      { name: "", role: "Language Officer", vacant: true },
    ],
  },
];

/** What the seed calls a role nobody has filled yet. */
export const PLACEHOLDER_NAME = "Get in touch if interested!";
