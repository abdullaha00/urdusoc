/**
 * Site chrome — the copy that rarely changes and isn't worth an admin screen.
 *
 * Everything that a committee edits regularly (events, verses, gallery, the
 * committee roster) lives in the database and is edited at /admin. This file is
 * for wording that only changes when the society itself changes.
 *
 * The destinations below are taken from the society's own public listings —
 * see the Cambridge SU page linked in EXTERNAL_LINKS. Check them at handover,
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
 * this goes public — see the note at the top of /urdu.
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

export const hero = {
  label: society.name,
  titleUrdu: society.nameUrdu,
  headline: society.tagline,
  supporting:
    "Mushairas, conversation evenings and chai socials — open to anyone who loves the language, whether you grew up with it or are hearing your first ghazal.",
  primaryCta: { label: "Explore upcoming events", href: "/events" },
  secondaryCta: {
    label: "Follow us on Instagram",
    href: EXTERNAL_LINKS.instagram,
  },
  /** Three words set as a manuscript title page in the hero artwork. */
  motifWords: [
    { urdu: "زبان", english: "Language" },
    { urdu: "ادب", english: "Literature" },
    { urdu: "ثقافت", english: "Culture" },
  ],
  motifFooter: { latin: "Cambridge", urdu: "کیمبرج" },
} as const;

export const pillars = [
  {
    title: "Poetry",
    body: "Mushairas, open mics and unhurried literary discussion, from classical ghazal to writing made this term.",
  },
  {
    title: "Language",
    body: "Conversation circles and script sessions that welcome complete beginners and fluent speakers alike.",
  },
  {
    title: "Community",
    body: "Chai socials, film nights and collaborations with societies across Cambridge and beyond.",
  },
] as const;

export const about = {
  heading: "Three threads run through everything we put on.",
  intro:
    "UrduSoc has one purpose: to make a place in Cambridge where Urdu is spoken, read and enjoyed. We meet through Michaelmas, Lent and Easter — some evenings are literary, some are simply a pot of chai and good company.",
  membership:
    "Everything we run is open to members and non-members alike; membership just means you hear about it first, and it helps us pay for the chai.",
} as const;

export const joinCta = {
  heading: "Find your Urdu community in Cambridge.",
  body: "Membership is open to students, alumni and friends of the society — no prior Urdu needed, only curiosity.",
  primaryCta: { label: "Join UrduSoc", href: "/join" },
  secondaryCta: { label: "View term card", href: "/events" },
} as const;

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
 * not in the database — the cards printed "TBC" or "Week 3" instead of a date —
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
 * Written as placeholders on purpose. The brief asked for the page but supplied
 * no real programmes, and inventing charitable work a society has not done
 * would be a lie that outlives whoever wrote it. Replace each strand with
 * something the society actually ran, or delete it.
 */
export const outreach = {
  intro:
    "Urdu belongs to more people than a university. Alongside what we run in college, we take the language outwards — and lend a hand where the need has nothing to do with Urdu at all.",
  strands: [
    {
      title: "Schools",
      body: "Poetry and script workshops with local schools and supplementary classes, pitched at students who hear Urdu at home but have never read it.",
      status: "Being planned for Michaelmas.",
    },
    {
      title: "Translation",
      body: "Helping put small pieces of Urdu writing — a letter, a poem, a family document — into English for people who ask.",
      status: "Ongoing, by request.",
    },
    {
      title: "Beyond the language",
      body: "Joining other Cambridge societies on work that has nothing to do with Urdu: food-bank collections and street kitchens through the winter.",
      status: "Termly.",
    },
  ],
  closing:
    "If you run something we could help with, or want us to bring a workshop to your school or group, write to us — we would rather be asked than guess.",
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
    "Questions about an event, an idea for one, a collaboration, or a press enquiry — all of it comes to the same place, and one of us will reply.",
  /** Replace with the committee's Google Form once it exists. */
  enquiryFormUrl: PLACEHOLDER_LINK,
  routes: [
    {
      title: "General enquiries",
      body: "Anything at all. This reaches the whole committee, so it gets answered even in vacation.",
    },
    {
      title: "Collaborations",
      body: "If your society wants to co-host an evening, say roughly what you have in mind and which term you are aiming at.",
    },
    {
      title: "Press and alumni",
      body: "If you studied here and want to stay in touch, or you are writing about the society, start here.",
    },
  ],
} as const;

export const footer = {
  blurb:
    "A student-run society for Urdu language, literature and culture, meeting through Michaelmas, Lent and Easter terms.",
  motto: "زبان، ادب، ثقافت",
  copyright: `© ${new Date().getFullYear()} ${society.name}. Run by students, for everyone.`,
} as const;
