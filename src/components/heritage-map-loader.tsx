"use client";

import dynamic from "next/dynamic";

/**
 * Loads the map only in the browser.
 *
 * Leaflet reaches for `window` at module scope, so it cannot be server
 * rendered. `ssr: false` is not allowed from a Server Component, which is why
 * this thin client wrapper exists - /history itself stays a Server Component.
 */
const HeritageMap = dynamic(
  () => import("@/components/heritage-map").then((mod) => mod.HeritageMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[26rem] items-center justify-center border-y-2 border-forest/25 bg-paper-deep sm:h-[32rem] lg:h-[36rem]">
        <p className="text-xs tracking-[0.2em] text-ink-muted uppercase">
          Loading the map…
        </p>
      </div>
    ),
  },
);

export function HeritageMapLoader() {
  return <HeritageMap />;
}
