/**
 * Read queries for the committee admin.
 *
 * Deliberately separate from `src/lib/queries.ts`: those filter to published
 * rows because they serve the public site. These must show drafts too, so the
 * committee can see what they have not released yet. Keep the two apart — a
 * `published` filter quietly added here would hide drafts from their authors,
 * and one removed there would leak them to visitors.
 */

import "server-only";

import { and, asc, count, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  admins,
  albums,
  committee,
  committeeCohorts,
  events,
  members,
  photos,
  registrations,
  subscribers,
  verses,
  type Admin,
  type Album,
  type CommitteeCohort,
  type Event,
  type Registration,
} from "@/lib/db/schema";

/** Seats claimed by everyone who has not cancelled. */
const seatsTakenSql = sql<number>`coalesce(sum(case when ${registrations.status} <> 'cancelled' then ${registrations.quantity} else 0 end), 0)::int`;

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

export type AdminEvent = Event & { seatsTaken: number };

/** Every event, drafts included, newest first, with seats already claimed. */
export async function getAdminEvents(): Promise<AdminEvent[]> {
  const rows = await getDb()
    .select({ event: events, seatsTaken: seatsTakenSql })
    .from(events)
    .leftJoin(registrations, eq(registrations.eventId, events.id))
    .groupBy(events.id)
    .orderBy(desc(events.startsAt));

  return rows.map((row) => ({ ...row.event, seatsTaken: row.seatsTaken }));
}

export async function getAdminEventById(id: string): Promise<Event | null> {
  const [event] = await getDb()
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  return event ?? null;
}

export async function getAdminEventWithSeats(
  id: string,
): Promise<AdminEvent | null> {
  const [row] = await getDb()
    .select({ event: events, seatsTaken: seatsTakenSql })
    .from(events)
    .leftJoin(registrations, eq(registrations.eventId, events.id))
    .where(eq(events.id, id))
    .groupBy(events.id)
    .limit(1);

  return row ? { ...row.event, seatsTaken: row.seatsTaken } : null;
}

/** The door list: everyone booked, in the order they booked. */
export async function getRegistrations(
  eventId: string,
): Promise<Registration[]> {
  return getDb()
    .select()
    .from(registrations)
    .where(eq(registrations.eventId, eventId))
    .orderBy(asc(registrations.createdAt));
}

/* -------------------------------------------------------------------------- */
/* Content                                                                     */
/* -------------------------------------------------------------------------- */

export async function getAdminVerses() {
  return getDb()
    .select()
    .from(verses)
    .orderBy(desc(verses.featured), desc(verses.createdAt));
}

export async function getAdminVerseById(id: string) {
  const [verse] = await getDb()
    .select()
    .from(verses)
    .where(eq(verses.id, id))
    .limit(1);

  return verse ?? null;
}

export async function getAdminCommittee() {
  return getDb()
    .select()
    .from(committee)
    .orderBy(
      desc(committee.academicYear),
      asc(committee.orderIndex),
      asc(committee.role),
    );
}

export async function getCommitteeMemberById(id: string) {
  const [person] = await getDb()
    .select()
    .from(committee)
    .where(eq(committee.id, id))
    .limit(1);

  return person ?? null;
}

export type AdminAlbum = Album & { photoCount: number };

/** Albums including unpublished, with how many photographs each holds. */
export async function getAdminAlbums(): Promise<AdminAlbum[]> {
  const rows = await getDb()
    .select({ album: albums, photoCount: count(photos.id) })
    .from(albums)
    .leftJoin(photos, eq(photos.albumId, albums.id))
    .groupBy(albums.id)
    .orderBy(desc(albums.createdAt));

  return rows.map((row) => ({ ...row.album, photoCount: Number(row.photoCount) }));
}

export async function getAdminAlbumById(id: string): Promise<Album | null> {
  const [album] = await getDb()
    .select()
    .from(albums)
    .where(eq(albums.id, id))
    .limit(1);

  return album ?? null;
}

export async function getAlbumPhotos(albumId: string) {
  return getDb()
    .select()
    .from(photos)
    .where(eq(photos.albumId, albumId))
    .orderBy(asc(photos.orderIndex), asc(photos.createdAt));
}

/** Published events, for the "photos from" picker on an album. */
export async function getEventOptions() {
  return getDb()
    .select({ id: events.id, title: events.title, startsAt: events.startsAt })
    .from(events)
    .orderBy(desc(events.startsAt));
}

/* -------------------------------------------------------------------------- */
/* People                                                                      */
/* -------------------------------------------------------------------------- */

export type MemberFilters = {
  /** Matched against name, email and CRSid. */
  q?: string;
  status?: string;
  type?: string;
};

/**
 * Filtering happens in SQL rather than in the page.
 *
 * A society this size would survive filtering in JavaScript, but the export
 * routes share these functions and a CSV that silently differs from the list
 * on screen would be worse than a slow one.
 */
export async function getMembers(filters: MemberFilters = {}) {
  const conditions = [];

  if (filters.q) {
    const pattern = `%${filters.q.trim().toLowerCase()}%`;
    conditions.push(
      sql`(lower(${members.name}) like ${pattern} or lower(${members.email}) like ${pattern} or lower(coalesce(${members.crsid}, '')) like ${pattern})`,
    );
  }
  if (filters.status) {
    conditions.push(sql`${members.status}::text = ${filters.status}`);
  }
  if (filters.type) {
    conditions.push(sql`${members.type}::text = ${filters.type}`);
  }

  return getDb()
    .select()
    .from(members)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(members.createdAt));
}

export type SubscriberFilters = { q?: string; status?: string };

export async function getSubscribers(filters: SubscriberFilters = {}) {
  const conditions = [];

  if (filters.q) {
    const pattern = `%${filters.q.trim().toLowerCase()}%`;
    conditions.push(sql`lower(${subscribers.email}) like ${pattern}`);
  }
  if (filters.status) {
    conditions.push(sql`${subscribers.status}::text = ${filters.status}`);
  }

  return getDb()
    .select()
    .from(subscribers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(subscribers.createdAt));
}

/** Totals across the whole table, regardless of the current filter. */
export async function getMemberTotals() {
  const rows = await getDb()
    .select({ status: members.status, value: count() })
    .from(members)
    .groupBy(members.status);

  const totals = { active: 0, pending: 0, expired: 0, all: 0 };
  for (const row of rows) {
    totals[row.status] = row.value;
    totals.all += row.value;
  }
  return totals;
}

export async function getSubscriberTotals() {
  const rows = await getDb()
    .select({ status: subscribers.status, value: count() })
    .from(subscribers)
    .groupBy(subscribers.status);

  const totals = { pending: 0, confirmed: 0, unsubscribed: 0, all: 0 };
  for (const row of rows) {
    totals[row.status] = row.value;
    totals.all += row.value;
  }
  return totals;
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

export type DashboardSummary = {
  nextEvent: AdminEvent | null;
  draftEvents: number;
  activeMembers: number;
  confirmedSubscribers: number;
  pendingSubscribers: number;
  unpublishedAlbums: number;
  verseCount: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const db = getDb();

  const [nextEventRows, drafts, membersActive, subsConfirmed, subsPending, albumsDraft, versesAll] =
    await Promise.all([
      db
        .select({ event: events, seatsTaken: seatsTakenSql })
        .from(events)
        .leftJoin(registrations, eq(registrations.eventId, events.id))
        .where(sql`${events.startsAt} >= now()`)
        .groupBy(events.id)
        .orderBy(asc(events.startsAt))
        .limit(1),
      db.select({ value: count() }).from(events).where(eq(events.published, false)),
      db.select({ value: count() }).from(members).where(eq(members.status, "active")),
      db
        .select({ value: count() })
        .from(subscribers)
        .where(eq(subscribers.status, "confirmed")),
      db
        .select({ value: count() })
        .from(subscribers)
        .where(eq(subscribers.status, "pending")),
      db.select({ value: count() }).from(albums).where(eq(albums.published, false)),
      db.select({ value: count() }).from(verses),
    ]);

  const first = nextEventRows[0];

  return {
    nextEvent: first ? { ...first.event, seatsTaken: first.seatsTaken } : null,
    draftEvents: drafts[0]?.value ?? 0,
    activeMembers: membersActive[0]?.value ?? 0,
    confirmedSubscribers: subsConfirmed[0]?.value ?? 0,
    pendingSubscribers: subsPending[0]?.value ?? 0,
    unpublishedAlbums: albumsDraft[0]?.value ?? 0,
    verseCount: versesAll[0]?.value ?? 0,
  };
}

/** Bookings that are neither cancelled nor yet checked in, for the door list. */
export async function getOutstandingCount(eventId: string): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        ne(registrations.status, "cancelled"),
        sql`${registrations.checkedInAt} is null`,
      ),
    );

  return row?.value ?? 0;
}

/** Every year's group photo and note, keyed by academic year. */
export async function getCommitteeCohorts(): Promise<
  Map<string, CommitteeCohort>
> {
  const rows = await getDb().select().from(committeeCohorts);
  return new Map(rows.map((row) => [row.academicYear, row]));
}

/* -------------------------------------------------------------------------- */
/* Access                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The sign-in allowlist, owners first.
 *
 * `admins.role` is a Postgres enum declared as ("owner", "editor"), and enums
 * sort by declaration order, so ascending puts owners at the top without a
 * CASE expression.
 */
export async function listAdmins(): Promise<Admin[]> {
  return getDb()
    .select()
    .from(admins)
    .orderBy(asc(admins.role), asc(admins.createdAt));
}
