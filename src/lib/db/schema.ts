/**
 * Database schema.
 *
 * Column names are written out in snake_case so the generated SQL reads plainly
 * for whoever inherits this. Money is always integer pence — never floats.
 */

import type { AdapterAccountType } from "next-auth/adapters";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * What kind of evening it is. This is the *shape* of the event, and drives the
 * decorative Urdu label — not its colour on /events.
 *
 * "collaboration" is deliberately absent: whether a partner society is involved
 * is an independent axis, held by `events.isCollaboration`. An evening can be a
 * mushaira *and* a collaboration, which the old single-enum model could not say.
 */
export const eventKindEnum = pgEnum("event_kind", [
  "mushaira",
  "social",
  "workshop",
  "talk",
]);

/**
 * The colour-coded axis shown in the legend on /events.
 *
 * Kept to three broad bands on purpose. A longer list would need a longer
 * legend, and the swatches stop being distinguishable at the size they print.
 */
export const eventCategoryEnum = pgEnum("event_category", [
  "academic",
  "cultural",
  "social",
]);

/** How people sign up: not at all, a free capped list, or a paid ticket. */
export const ticketingModeEnum = pgEnum("ticketing_mode", [
  "none",
  "rsvp",
  "paid",
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "reserved",
  "paid",
  "cancelled",
  "checked_in",
]);

export const membershipTypeEnum = pgEnum("membership_type", [
  "student",
  "alumni",
  "friend",
]);

export const memberStatusEnum = pgEnum("member_status", [
  "pending",
  "active",
  "expired",
]);

export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "pending",
  "confirmed",
  "unsubscribed",
]);

/** Owners may manage the admin allowlist; editors may only manage content. */
export const adminRoleEnum = pgEnum("admin_role", ["owner", "editor"]);

/* -------------------------------------------------------------------------- */
/* Auth.js tables                                                              */
/* -------------------------------------------------------------------------- */

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

/* -------------------------------------------------------------------------- */
/* Committee access                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Allowlist of addresses permitted to sign in to /admin. Signing in is refused
 * for anyone not listed here, so a leaked magic link to a stranger is useless.
 * Handover: the outgoing president adds the incoming one, then removes their own row.
 */
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: adminRoleEnum("role").notNull().default("editor"),
  addedByEmail: text("added_by_email"),
  lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    /** Optional Urdu title, shown in Nastaliq alongside the English. */
    titleUrdu: text("title_urdu"),
    kind: eventKindEnum("kind").notNull().default("mushaira"),
    /** Decorative Urdu label for the event card, e.g. محفل. */
    kindUrdu: text("kind_urdu"),
    /** Drives the colour swatch on the postcard and the legend on /events. */
    category: eventCategoryEnum("category").notNull().default("cultural"),
    /**
     * True when another society, organisation or institution co-hosts.
     * Independent of `kind` — see the note on `eventKindEnum`.
     */
    isCollaboration: boolean("is_collaboration").notNull().default(false),
    /**
     * Names of the co-hosts, e.g. {"PakSoc","Majlis"}. May be empty even when
     * `isCollaboration` is true: old term cards recorded that an evening was
     * joint without always naming the partner.
     */
    collaborators: text("collaborators").array().notNull().default([]),
    /** One sentence, used on cards and in metadata. */
    summary: text("summary").notNull(),
    /** Optional long description (Markdown). */
    body: text("body"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    /**
     * False when only the date is known — an event recovered from an old term
     * card, or one whose hour is not fixed yet. The site then shows the date
     * alone rather than printing a start time nobody confirmed.
     */
    showTime: boolean("show_time").notNull().default(true),
    /** Null when the venue was never recorded. Old term cards rarely gave one. */
    venue: text("venue"),
    /** Null means uncapped. */
    capacity: integer("capacity"),
    ticketing: ticketingModeEnum("ticketing").notNull().default("none"),
    pricePence: integer("price_pence").notNull().default(0),
    /**
     * Pushes the event into the carousel above the grid on /events. When no
     * event is flagged, the carousel falls back to the nearest upcoming ones,
     * so the section is never empty — see `getFeaturedEvents`.
     */
    featured: boolean("featured").notNull().default(false),
    /** Orders the carousel when several events are featured. Higher wins. */
    priority: integer("priority").notNull().default(0),
    /** Optional poster art. Absent is the normal case — the card is designed
     *  to look finished without one. */
    posterUrl: text("poster_url"),
    /** Required by the admin form whenever `posterUrl` is set. */
    posterAlt: text("poster_alt"),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("events_starts_at_idx").on(table.startsAt)],
);

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    quantity: integer("quantity").notNull().default(1),
    /** Short human-readable code shown on the door list. */
    reference: text("reference").notNull().unique(),
    status: registrationStatusEnum("status").notNull().default("reserved"),
    /** Set for paid events; unique so replayed Stripe webhooks are no-ops. */
    stripeSessionId: text("stripe_session_id").unique(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  },
  (table) => [
    // One booking per address per event.
    uniqueIndex("registrations_event_email_idx").on(table.eventId, table.email),
    index("registrations_event_idx").on(table.eventId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Membership and mailing list                                                 */
/* -------------------------------------------------------------------------- */

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    /** Cambridge CRSid, if they have one. */
    crsid: text("crsid"),
    type: membershipTypeEnum("type").notNull().default("student"),
    status: memberStatusEnum("status").notNull().default("pending"),
    pricePence: integer("price_pence").notNull().default(0),
    stripeSessionId: text("stripe_session_id").unique(),
    stripeCustomerId: text("stripe_customer_id"),
    /** Null means life membership. */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("members_status_idx").on(table.status)],
);

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  status: subscriberStatusEnum("status").notNull().default("pending"),
  /** Used for both the double opt-in link and one-click unsubscribe. */
  token: text("token").notNull().unique(),
  /** Where they signed up, e.g. "footer" or "join". */
  source: text("source"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Gallery                                                                     */
/* -------------------------------------------------------------------------- */

export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  /** Optional link back to the event the photos came from. */
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  takenOn: timestamp("taken_on", { withTimezone: true }),
  /**
   * Name of the CSS placeholder drawn when the album has no photos yet
   * (see src/components/past-moments.tsx). Lets the site look finished before
   * the committee has uploaded anything.
   */
  motif: text("motif"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    /** Required — the admin upload form will not accept a photo without it. */
    alt: text("alt").notNull(),
    caption: text("caption"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("photos_album_idx").on(table.albumId, table.orderIndex)],
);

/* -------------------------------------------------------------------------- */
/* Committee roster and verse archive                                          */
/* -------------------------------------------------------------------------- */

export const committee = pgTable(
  "committee",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    nameUrdu: text("name_urdu"),
    /**
     * Free text, not an enum — roles genuinely change between committees, and
     * two people may share one ("Co-President"). Nothing here assumes a role
     * appears only once in a year.
     */
    role: text("role").notNull(),
    bio: text("bio"),
    email: text("email"),
    photoUrl: text("photo_url"),
    /** Shown for past years, where there is no bio to carry the person. */
    college: text("college"),
    course: text("course"),
    /** Academic year, e.g. "2026–27". */
    academicYear: text("academic_year").notNull(),
    isCurrent: boolean("is_current").notNull().default(true),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (table) => [
    index("committee_year_idx").on(table.academicYear, table.orderIndex),
  ],
);

/**
 * One row per past committee: the group photo and a line of context.
 *
 * Separate from `committee` because it is per-year, not per-person. Keeping the
 * archive this light is the point — a past year costs one photo and a roster of
 * names, so there is no reason for a future committee to ever delete one.
 */
export const committeeCohorts = pgTable("committee_cohorts", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Matches `committee.academic_year`, e.g. "2025–26". */
  academicYear: text("academic_year").notNull().unique(),
  photoUrl: text("photo_url"),
  /** Required by the admin form whenever `photoUrl` is set. */
  photoAlt: text("photo_alt"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * The couplets shown in "From the world of Urdu". Exactly one row should have
 * `featured` set; the rest form the archive on /urdu.
 */
export const verses = pgTable("verses", {
  id: uuid("id").primaryKey().defaultRandom(),
  urduLines: text("urdu_lines").array().notNull(),
  transliterationLines: text("transliteration_lines").array().notNull(),
  translation: text("translation").notNull(),
  poetName: text("poet_name").notNull(),
  poetUrdu: text("poet_urdu"),
  poetYears: text("poet_years"),
  note: text("note"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Inferred types                                                              */
/* -------------------------------------------------------------------------- */

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type CommitteeMember = typeof committee.$inferSelect;
export type CommitteeCohort = typeof committeeCohorts.$inferSelect;
export type Verse = typeof verses.$inferSelect;
export type Admin = typeof admins.$inferSelect;
