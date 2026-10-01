/**
 * Site chrome - the copy that rarely changes and isn't worth an admin screen.
 *
 * Everything that a committee edits regularly (events, verses, gallery, the
 * committee roster) lives in the database and is edited at /admin. This file is
 * for wording that only changes when the society itself changes.
 *
 * The destinations below are taken from the society's own public listings -
 * see the Cambridge SU page linked in EXTERNAL_LINKS. Check them each year,
 * since a new committee sometimes moves the Instagram account.
 */

/** Stand-in for an external URL nobody has supplied yet. */
export const PLACEHOLDER_LINK = "#";

/** The society's address, as published on its Cambridge SU listing. */
export const CONTACT_EMAIL = "urdu@cambridgesu.co.uk";

export const EXTERNAL_LINKS = {
  instagram: "https://www.instagram.com/cambridgeurdusoc/",
  cambridgeSu: "https://www.cambridgesu.co.uk/organisation/20748/",
} as const;

export const society = {
  name: "Cambridge University Urdu Society",
  shortName: "UrduSoc",
  nameUrdu: "اردو سوسائٹی",
  tagline: "A home for Urdu language, literature and culture in Cambridge.",
} as const;

export const navLinks = [
  { label: "Events", href: "/events" },
  { label: "Urdu & Poetry", href: "/urdu" },
  { label: "History", href: "/history" },
  { label: "Gallery", href: "/gallery" },
  { label: "Outreach", href: "/outreach" },
  { label: "About", href: "/about" },
  { label: "Committee", href: "/committee" },
  { label: "Contact", href: "/contact" },
] as const;

/**
 * The couplet in the scroll section on the home page.
 *
 * From Iqbal's "Sitaron se aage jahan aur bhi hain". The attribution is worth
 * keeping exact: Iqbal matriculated at Trinity in 1905, which is the thread
 * this society has to Cambridge and the reason the verse is here rather than
 * any other.
 *
 * ⚠️ The Urdu was supplied by the previous committee's brief, which flagged it
 * as AI-drafted and unverified. Have a fluent reader check both lines before
 * this goes public - see the note at the top of /urdu.
 */
export const iqbalQuote = {
  lines: [
    {
      english: "You are an eagle, flight is your vocation:",
      urdu: "تو شاہیں ہے، پرواز ہے کام تیرا",
    },
    {
      english: "You have other skies stretching out before you.",
      urdu: "ترے سامنے آسماں اور بھی ہیں",
    },
  ],
  attribution: "Allama Muhammad Iqbal · Trinity College, Cambridge (m. 1905)",
} as const;

/**
 * Membership is run by the SU, not by this site: joining means signing up on
 * the society's Cambridge SU listing, which is where the SU counts members and
 * takes any fee. Every join button on the site therefore leads off site. The
 * form that used to do this here is kept in archive/join.
 *
 * Defined above `hero` because every join button on the site reads its label
 * and href from here - the header, the hero, /about, an event page and the
 * subscribe confirmation. If the wording changes, change it once, here.
 *
 * The short name is deliberate: "Join Cambridge University Urdu Society" is a
 * 37-character button label that wraps to three lines on a phone. The full name
 * is carried by the header identity line and the footer lockup instead.
 */
export const joinCta = {
  primaryCta: {
    label: `Join ${society.shortName}`,
    href: EXTERNAL_LINKS.cambridgeSu,
  },
  secondaryCta: { label: "View term card", href: "/events" },
} as const;

export const hero = {
  label: society.name,
  titleUrdu: society.nameUrdu,
  headline: society.tagline,
  supporting:
    "For Urdu speakers, learners and anyone curious about the language and culture. ",
  primaryCta: joinCta.primaryCta,
  secondaryCta: {
    label: "Instagram",
    href: EXTERNAL_LINKS.instagram,
  },
  /**
   * Three words set as a manuscript title page, shown in place of the events
   * panel between terms, when there is nothing upcoming to list.
   */
  motifWords: [
    { urdu: "زبان", english: "Language" },
    { urdu: "ادب", english: "Literature" },
    { urdu: "ثقافت", english: "Culture" },
  ],
  motifFooter: { latin: "Cambridge", urdu: "کیمبرج" },
} as const;

/**
 * Every evening named here actually happened, and is in the archive on /events
 * with the date and venue it was given. That is the point: a description made
 * of real nights tells a visitor what this society is in a way no amount of
 * "unhurried literary discussion" ever did.
 *
 * It follows that this copy expires. When the examples are three years stale,
 * replace them with newer ones from /events rather than reaching for adjectives
 * - and check the claim still holds before you write it.
 */
export const pillars = [
  {
    title: "Poetry",
    body: "Mushairas and open mics: Bazm-e-Yaar in the Hidden Rooms, Iqbal Day at Christ's, and one reading given from three punts on the Cam.",
  },
  {
    title: "Language",
    body: "Brunch and baat-cheet speaking classes at Fitzwilliam and King's, charades in Urdu, and a workshop on writing humour in Urdu poetry.",
  },
  {
    title: "Community",
    body: "Chai socials, ghost stories at Jinn-o-ween, screenings of Kamli and Zindagi Tamasha, and evenings shared with PakSoc, Majlis and CamSAMS.",
  },
] as const;

export const about = {
  heading: "Three threads run through everything we put on.",
  intro:
    "The Cambridge University Urdu Society has one purpose: to make a place in Cambridge where Urdu is spoken, read and enjoyed. We meet through Michaelmas, Lent and Easter - some evenings are literary, some are simply a pot of chai and good company.",
  membership:
    "Membership is completely free - join via the button below!",
} as const;

/**
 * Only describes who the society is open to - signup happens on the SU page,
 * so these are no longer a choice anyone makes on this site. Still used by the
 * archived join form and by the members table's `type` column.
 */
export const membershipTiers = [
  {
    id: "student",
    name: "Student",
    description: "Current Cambridge students, undergraduate or postgraduate.",
    pricePence: 0,
    note: "Free while we are funded by the SU.",
  },
  {
    id: "alumni",
    name: "Alumni",
    description: "Anyone who has studied at Cambridge and wants to stay close.",
    pricePence: 0,
  },
  {
    id: "friend",
    name: "Friend of the society",
    description: "Everyone else who loves Urdu and wants to hear from us.",
    pricePence: 0,
  },
] as const;

export const footerGroups = [
  {
    title: "Connect",
    links: [
      { label: "Instagram", href: EXTERNAL_LINKS.instagram },
      { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
      // The SU listing is reached from the affiliation lockup in the footer's
      // first column, so it is not repeated here.
    ],
  },
  {
    title: "Society",
    links: [
      { label: "Upcoming events", href: "/events" },
      { label: "Urdu & poetry", href: "/urdu" },
      { label: "Urdu Cambridge", href: "/history" },
      { label: "Outreach", href: "/outreach" },
      { label: "Committee", href: "/committee" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
] as const;

/**
 * Past term cards, shown as an archive on /events.
 *
 * Static rather than gallery albums, so they work without a Vercel Blob store:
 * add a term by dropping the images into public/term-cards/ and adding an entry
 * here. Once Blob is configured, /admin/gallery is the better home for anything
 * a committee adds regularly.
 *
 * The alt text lists each card's events on purpose. Several of these events are
 * not in the database - the cards printed "TBC" or "Week 3" instead of a date -
 * so for those the image is the only record, and its alt text is the only way a
 * screen reader can reach them.
 */
export const termCards = [
  {
    term: "Michaelmas 2025",
    images: [
      {
        src: "/term-cards/michaelmas-2025-1.jpg",
        width: 1170,
        height: 1170,
        alt: "Michaelmas 2025 term card, first of two. Chai and Chat! on 12 October, a freshers' event to meet the committee; South Asian Cambridge Walk with PakSoc, date to be confirmed; Jinn-o-ween themed open mic on 26 October; and Mushaira for Iqbal Day with Chai Shai on 9 November.",
      },
      {
        src: "/term-cards/michaelmas-2025-2.jpg",
        width: 1170,
        height: 1170,
        alt: "Michaelmas 2025 term card, second of two. 'Home Away From Home' shayari scrapbooking, date to be confirmed; In Conversation with Ghazal Studio on 28 November; and Chai and Chat!, the end of term social, on 29 November.",
      },
    ],
  },
  {
    term: "Lent 2026",
    images: [
      {
        src: "/term-cards/lent-2026-1.jpg",
        width: 1170,
        height: 1289,
        alt: "Lent 2026 term card, first of three. UrduSoc Brunch with Speaking Class 1 on 24 January; South Asian Tour with Jack's Social in week one; Urdu Teach-in and Workshop 1, 'In-Safar-able: Comic Relief After Grief' with Rawanee Creatives on 1 February; and UrduSoc Games Night in week three.",
      },
      {
        src: "/term-cards/lent-2026-2.jpg",
        width: 1170,
        height: 1289,
        alt: "Lent 2026 term card, second of three. UrduSoc Brunch with Speaking Class 2 on 8 February; Open Mic Night with CamSAMS, Majlis and PakSoc at Clare Cellars in week four; Urdu Teach-in and Workshop 2, 'Faiz and the Progressive Writers Movement' with Taha, on 15 February; and 'The Indian Caliphate: Poetry, Power, and Exile' in conversation with Imran Mulla in week four.",
      },
      {
        src: "/term-cards/lent-2026-3.jpg",
        width: 1170,
        height: 1289,
        alt: "Lent 2026 term card, third of three. Iftar Potluck with Speaking Class 3 on 22 February; Urdu Teach-in and Workshop 3 on 1 March; Iftar Potluck with Speaking Class 4 on 8 March; and the end of term social, shayari scrapbooking, on 15 March.",
      },
    ],
  },
] as const;

/**
 * /outreach.
 *
 * The page introduces ways for schools and groups to contact the society.
 */
export const outreach = {
  intro:
    "We’re always open to working with people and organisations beyond the University. If you’re an artist, speaker, cultural organisation, community group, school, charity or society with an idea for Cambridge UrduSoc, we’d love to hear from you.",
  closing:
    "Whether you have a collaboration in mind, would like to bring something to Cambridge, or simply want to start a conversation, get in touch.",
} as const;

/**
 * /contact.
 *
 * The brief asked for a Google Form for inbound enquiries. Until someone
 * creates one and pastes the link here, the page falls back to the society
 * address, which is checked and is a real destination.
 */
export const contact = {
  intro:
    "Questions about an event, an idea for one, a collaboration, or a press enquiry - all of it comes to the same place, and one of us will reply.",
  /** Replace with the committee's Google Form once it exists. */
  enquiryFormUrl: PLACEHOLDER_LINK,
  routes: [
    {
      title: "General enquiries",
      body: "For questions about the society, our events, or anything else.",
    },
    {
      title: "Collaborations",
      body: "For societies, organisations, artists, speakers and community groups interested in working with UrduSoc or bringing something to Cambridge.",
    },
    {
      title: "Press and alumni",
      body: "For press enquiries, former members and alumni who would like to reconnect with the society.",
    },
  ],
} as const;

export const footer = {
  blurb:
    "A student-run society for Urdu language, literature and culture.",
  motto: "زبان، ادب، ثقافت",
  copyright: `© ${new Date().getFullYear()} ${society.name}. Run by students, for everyone.`,
} as const;
