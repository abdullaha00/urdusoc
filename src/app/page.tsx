import { FeaturedUrdu } from "@/components/featured-urdu";
import { Hero } from "@/components/hero";
import { IqbalQuote } from "@/components/iqbal-quote";
import { PastMoments } from "@/components/past-moments";
// import { WhatWeDo } from "@/components/what-we-do";
import {
  getAlbumCovers,
  getFeaturedVerse,
  getPublishedAlbums,
  getUpcomingEvents,
} from "@/lib/queries";

// Rendered on demand: the page reads live data, and this keeps `next build`
// working without database credentials. See README for the ISR alternative.
export const dynamic = "force-dynamic";

/** As many evenings as the hero panel can list without becoming a wall. */
const HERO_EVENT_COUNT = 3;

export default async function Home() {
  const [upcoming, verse, albums] = await Promise.all([
    getUpcomingEvents(),
    getFeaturedVerse(),
    getPublishedAlbums(3),
  ]);

  const covers = await getAlbumCovers(albums.map((album) => album.id));

  return (
    <>
      {/* The hero carries the programme now, so there is no separate upcoming
          event section - joining and Instagram move up into its place. */}
      <Hero events={upcoming.slice(0, HERO_EVENT_COUNT)} />
      {/* Sits between the practical top of the page and the literary lower
          half - the pinned scroll is the hinge between the two. */}
      <IqbalQuote />
      {/* Hidden for now. */}
      {/* <WhatWeDo /> */}
      <FeaturedUrdu verse={verse} />
      <PastMoments albums={albums} covers={covers} />
    </>
  );
}
