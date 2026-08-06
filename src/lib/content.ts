/**
 * Site chrome — the copy that rarely changes and isn't worth an admin screen.
 *
 * Everything that a committee edits regularly (events, verses, gallery, the
 * committee roster) lives in the database and is edited at /admin. This file is
 * for wording that only changes when the society itself changes.
 *
 * The external links below are still placeholders. Replace EXTERNAL_LINKS and
 * CONTACT_EMAIL with the society's real destinations before going live.
 */

/** Stand-in for an external URL nobody has supplied yet. */
export const PLACEHOLDER_LINK = "#";

/** Placeholder inbox — swap for the committee's real address. */
export const CONTACT_EMAIL = "hello@urdusoc.cam.ac.uk";

export const EXTERNAL_LINKS = {
  instagram: PLACEHOLDER_LINK,
  cambridgeSu: PLACEHOLDER_LINK,
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
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Committee", href: "/committee" },
] as const;

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
      { label: "Cambridge SU page", href: EXTERNAL_LINKS.cambridgeSu },
    ],
  },
  {
    title: "Society",
    links: [
      { label: "Upcoming events", href: "/events" },
      { label: "Urdu & poetry", href: "/urdu" },
      { label: "Committee", href: "/committee" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
] as const;

export const footer = {
  blurb:
    "A student-run society for Urdu language, literature and culture, meeting through Michaelmas, Lent and Easter terms.",
  motto: "زبان، ادب، ثقافت",
  copyright: `© ${new Date().getFullYear()} ${society.name}. Run by students, for everyone.`,
} as const;
