/**
 * Read queries used by the public pages.
 *
 * Everything here is a plain async function calling Drizzle - no caching layer,
 * because the pages that use them are rendered on demand. Keep it that way
 * unless you have a measured reason not to; cache invalidation is the usual
 * thing that breaks when a committee changes hands.
 */

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  albums,
  committee,
  committeeCohorts,
  events,
  photos,
  registrations,
  verses,
  type Album,
  type CommitteeCohort,
  type CommitteeMember,
  type Event,
  type Photo,
} from "@/lib/db/schema";

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Every published event still to come, soonest first, followed by events whose
 * date is TBC.
 *
 * Both callers want a list: /events shows the whole programme, and the home
 * page hero takes the first few off the top.
 */
export async function getUpcomingEvents(): Promise<Event[]> {
  return getDb()
    .select()
    .from(events)
    .where(
      and(
        eq(events.published, true),
        or(isNull(events.startsAt), gte(events.startsAt, new Date())),
      ),
    )
    .orderBy(sql`${events.startsAt} asc nulls last`);
}

/**
 * The archive, newest first. Unlimited by default.
 *
 * It used to stop at twelve, which was the whole archive at the time. It no
 * longer is - the events recovered from the society's Instagram take it back to
 * the launch in March 2022 - and /events shows the lot, so a limit here would
 * silently cut the archive off at the last dozen evenings.
 */
export async function getPastEvents(limit?: number): Promise<Event[]> {
  const query = getDb()
    .select()
    .from(events)
    .where(and(eq(events.published, true), lt(events.startsAt, new Date())))
    .orderBy(desc(events.startsAt));

  return limit === undefined ? query : query.limit(limit);
}

export type EventPoster = {
  id: string;
  title: string;
  startsAt: Date | null;
  posterUrl: string;
  posterAlt: string | null;
  instagramUrl: string | null;
};

/**
 * Every published event that has poster art, newest first - the visual archive
 * on /gallery.
 *
 * Only the columns that section prints. A poster is announcement artwork rather
 * than a photograph of the evening, which is why these are not album rows: the
 * gallery keeps the two apart and says which is which.
 */
export async function getEventPosters(): Promise<EventPoster[]> {
  const rows = await getDb()
    .select({
      id: events.id,
      title: events.title,
      startsAt: events.startsAt,
      posterUrl: events.posterUrl,
      posterAlt: events.posterAlt,
      instagramUrl: events.instagramUrl,
    })
    .from(events)
    .where(and(eq(events.published, true), isNotNull(events.posterUrl)))
    .orderBy(sql`${events.startsAt} desc nulls last`);

  // `isNotNull` above has already done the filtering; this narrows the type.
  return rows.filter(
    (row): row is EventPoster => row.posterUrl !== null,
  );
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const [event] = await getDb()
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.published, true)))
    .limit(1);

  return event ?? null;
}

/** Seats taken so far. Cancelled bookings free their seats up again. */
export async function getSeatsTaken(eventId: string): Promise<number> {
  const [row] = await getDb()
    .select({ total: sql<number>`coalesce(sum(${registrations.quantity}), 0)::int` })
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        sql`${registrations.status} <> 'cancelled'`,
      ),
    );

  return row?.total ?? 0;
}

export type EventAvailability = {
  capacity: number | null;
  taken: number;
  remaining: number | null;
  soldOut: boolean;
};

export async function getEventAvailability(
  event: Event,
): Promise<EventAvailability> {
  const taken = await getSeatsTaken(event.id);
  const remaining =
    event.capacity === null ? null : Math.max(0, event.capacity - taken);

  return {
    capacity: event.capacity,
    taken,
    remaining,
    soldOut: remaining !== null && remaining <= 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Verses                                                                      */
/* -------------------------------------------------------------------------- */

export async function getFeaturedVerse() {
  const [verse] = await getDb()
    .select()
    .from(verses)
    .where(eq(verses.featured, true))
    .limit(1);

  // Fall back to the most recent verse so the section is never empty.
  if (verse) return verse;

  const [fallback] = await getDb()
    .select()
    .from(verses)
    .orderBy(desc(verses.createdAt))
    .limit(1);

  return fallback ?? null;
}

export async function getVerseArchive() {
  return getDb().select().from(verses).orderBy(desc(verses.createdAt));
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                     */
/* -------------------------------------------------------------------------- */

export type AlbumWithPhotos = Album & {
  photos: Photo[];
  photoCount: number;
};

export async function getPublishedAlbums(limit?: number): Promise<Album[]> {
  const query = getDb()
    .select()
    .from(albums)
    .where(eq(albums.published, true))
    .orderBy(desc(albums.createdAt));

  return limit ? query.limit(limit) : query;
}

export async function getAlbumBySlug(
  slug: string,
): Promise<AlbumWithPhotos | null> {
  const db = getDb();

  const [album] = await db
    .select()
    .from(albums)
    .where(and(eq(albums.slug, slug), eq(albums.published, true)))
    .limit(1);

  if (!album) return null;

  const albumPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.albumId, album.id))
    .orderBy(asc(photos.orderIndex));

  return { ...album, photos: albumPhotos, photoCount: albumPhotos.length };
}

/** Cover image for an album listing - the first photo, if there is one. */
export async function getAlbumCovers(
  albumIds: string[],
): Promise<Map<string, Photo>> {
  if (albumIds.length === 0) return new Map();

  const rows = await getDb()
    .select()
    .from(photos)
    .where(sql`${photos.albumId} in ${albumIds}`)
    .orderBy(asc(photos.albumId), asc(photos.orderIndex));

  const covers = new Map<string, Photo>();
  for (const photo of rows) {
    if (!covers.has(photo.albumId)) covers.set(photo.albumId, photo);
  }
  return covers;
}

/* -------------------------------------------------------------------------- */
/* Committee                                                                   */
/* -------------------------------------------------------------------------- */

export async function getCurrentCommittee() {
  return getDb()
    .select()
    .from(committee)
    .where(eq(committee.isCurrent, true))
    .orderBy(asc(committee.orderIndex));
}

export async function getCommitteeYears(): Promise<string[]> {
  const rows = await getDb()
    .select({ year: committee.academicYear, total: count() })
    .from(committee)
    .groupBy(committee.academicYear)
    .orderBy(desc(committee.academicYear));

  return rows.map((row) => row.year);
}

/**
 * Past committees, newest year first, with each year's group photo attached.
 *
 * "Past" means `isCurrent` is false rather than "not the newest year", so a
 * committee mid-changeover - when both rosters are briefly on the site - does not
 * see the incoming year appear in the archive as well as at the top.
 *
 * The cohort row is optional: a year can be listed from its roster alone, which
 * is the normal case for anything before photos were kept.
 */
export async function getPastCommittees(): Promise<
  {
    year: string;
    cohort: CommitteeCohort | null;
    members: CommitteeMember[];
  }[]
> {
  const db = getDb();

  const [people, cohorts] = await Promise.all([
    db
      .select()
      .from(committee)
      .where(eq(committee.isCurrent, false))
      .orderBy(desc(committee.academicYear), asc(committee.orderIndex)),
    db.select().from(committeeCohorts),
  ]);

  const cohortByYear = new Map(
    cohorts.map((cohort) => [cohort.academicYear, cohort]),
  );

  // Insertion order follows the query's ordering, so the years come out newest
  // first without a second sort.
  const byYear = new Map<string, CommitteeMember[]>();
  for (const person of people) {
    const existing = byYear.get(person.academicYear);
    if (existing) existing.push(person);
    else byYear.set(person.academicYear, [person]);
  }

  return Array.from(byYear, ([year, members]) => ({
    year,
    cohort: cohortByYear.get(year) ?? null,
    members,
  }));
}
