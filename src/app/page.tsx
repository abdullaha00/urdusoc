import { FeaturedUrdu } from "@/components/featured-urdu";
import { Hero } from "@/components/hero";
import { JoinCta } from "@/components/join-cta";
import { PastMoments } from "@/components/past-moments";
import { UpcomingEvent } from "@/components/upcoming-event";
import { WhatWeDo } from "@/components/what-we-do";
import {
  getAlbumCovers,
  getFeaturedVerse,
  getNextEvent,
  getPublishedAlbums,
} from "@/lib/queries";

// Rendered on demand: the page reads live data, and this keeps `next build`
// working without database credentials. See README for the ISR alternative.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [event, verse, albums] = await Promise.all([
    getNextEvent(),
    getFeaturedVerse(),
    getPublishedAlbums(3),
  ]);

  const covers = await getAlbumCovers(albums.map((album) => album.id));

  return (
    <>
      <Hero />
      <UpcomingEvent event={event} />
      <WhatWeDo />
      <FeaturedUrdu verse={verse} />
      <PastMoments albums={albums} covers={covers} />
      <JoinCta />
    </>
  );
}
