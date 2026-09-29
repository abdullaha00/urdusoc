"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CAMBRIDGE_BOUNDS,
  CAMBRIDGE_CENTRE,
  HERITAGE_LOCATIONS,
  LOCATION_ZOOM,
  type HeritageLocation,
} from "@/lib/heritage";

/**
 * The Cambridge heritage map.
 *
 * Licensing, since it is the reason for each choice here:
 *   • Leaflet is BSD-2-Clause.
 *   • The basemap is CARTO Positron, free to use with attribution and with no
 *     account or API key, which is what keeps this deployable by a committee
 *     that owns no billing relationship. Attribution is rendered by Leaflet's
 *     own control and must not be removed.
 *   • The underlying map data is OpenStreetMap, ODbL, also attributed.
 * Google Maps is deliberately not used: it requires an API key and a billing
 * account, which is exactly the dependency a handover cannot survive.
 *
 * The brief specified exact hex values for land, river, buildings and roads.
 * Those need vector tiles, and every vector-tile host wants an API key — the
 * dependency we are avoiding. Instead the raster basemap is warmed with a CSS
 * filter to sit in the site's palette. The result is close in feeling, and free
 * in a way the exact-hex route is not. If a future committee is willing to take
 * on a keyed provider, this is the piece to revisit.
 *
 * Interaction follows the brief: the map opens locked, as an exhibition
 * display; "Explore map" hands over full control; clicking a pin zooms in and
 * opens a panel; closing the panel returns to the curated overview.
 *
 * This component is the map only. The written list of the same locations is
 * server-rendered on /history, deliberately outside this file — it must not
 * depend on Leaflet loading, on script running, or on a pointer, and putting
 * it here would have made it depend on all three.
 */

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * One pin design for every location, as specified — the historical distinction
 * belongs in the panel, not in a colour key nobody is given.
 */
function pinIcon(selected: boolean) {
  return L.divIcon({
    className: "heritage-pin-wrapper",
    html: `<span class="heritage-pin${selected ? " heritage-pin-selected" : ""}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function HeritageMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const [selected, setSelected] = useState<HeritageLocation | null>(null);
  const [exploring, setExploring] = useState(false);
  const [failed, setFailed] = useState(false);

  /** Returns to the curated overview. */
  const resetView = useCallback(() => {
    mapRef.current?.flyTo(
      [CAMBRIDGE_CENTRE.lat, CAMBRIDGE_CENTRE.lng],
      CAMBRIDGE_CENTRE.zoom,
      { duration: 1.1 },
    );
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const bounds = L.latLngBounds(
      [CAMBRIDGE_BOUNDS.south, CAMBRIDGE_BOUNDS.west],
      [CAMBRIDGE_BOUNDS.north, CAMBRIDGE_BOUNDS.east],
    );

    // Deferred so the failure path sets state from a callback rather than
    // synchronously inside the effect body.
    const reportFailure = () => setFailed(true);

    let map: L.Map;
    try {
      map = L.map(container, {
        center: [CAMBRIDGE_CENTRE.lat, CAMBRIDGE_CENTRE.lng],
        zoom: CAMBRIDGE_CENTRE.zoom,
        minZoom: 13,
        maxZoom: 18,
        maxBounds: bounds,
        maxBoundsViscosity: 1,
        // Locked by default — this opens as a display, not a navigation tool.
        dragging: false,
        scrollWheelZoom: false,
        // Two-finger drag still pans on touch once dragging is enabled, and
        // never steals a one-finger page scroll.
        touchZoom: true,
        doubleClickZoom: false,
        zoomControl: false,
        attributionControl: true,
      });
    } catch {
      // Leaflet could not initialise at all — show the fallback and leave the
      // list below as the route to the content.
      queueMicrotask(reportFailure);
      return;
    }

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      subdomains: "abcd",
      maxZoom: 20,
      detectRetina: true,
    })
      .on("tileerror", reportFailure)
      .addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    for (const location of HERITAGE_LOCATIONS) {
      const marker = L.marker([location.lat, location.lng], {
        icon: pinIcon(false),
        keyboard: true,
        title: location.name,
        alt: location.name,
      })
        .addTo(map)
        .on("click", () => setSelected(location));

      markersRef.current.set(location.id, marker);
    }

    mapRef.current = map;

    // Captured now: the ref's contents are cleared below, and reading
    // `markersRef.current` at cleanup time would be reading a moving target.
    const markers = markersRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, []);

  /** Dragging and wheel zoom follow the Explore toggle. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (exploring) {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
    } else {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
    }
  }, [exploring]);

  /** Highlight the open pin, and fly to it. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const [id, marker] of markersRef.current) {
      marker.setIcon(pinIcon(id === selected?.id));
    }

    if (!selected) return;

    map.flyTo([selected.lat, selected.lng], LOCATION_ZOOM, { duration: 1.1 });
    // While a location is open, allow a closer look around it regardless of
    // the Explore toggle; closing the panel puts the lock back.
    map.dragging.enable();
  }, [selected]);

  const closePanel = useCallback(() => {
    setSelected(null);
    if (!exploring) mapRef.current?.dragging.disable();
    resetView();
  }, [exploring, resetView]);

  /** Escape closes the panel, matching every other dismissible surface. */
  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, closePanel]);

  return (
    <div className="relative">
      {/* Framed top and bottom, so it reads as a curated display rather than a
          window onto an infinite map. */}
      <div className="relative overflow-hidden border-y-2 border-forest/25 bg-paper-deep">
        <div
          ref={containerRef}
          className="heritage-map h-[26rem] w-full sm:h-[32rem] lg:h-[36rem]"
          role="application"
          aria-label="Map of places in Cambridge connected to Urdu literary history"
        />

        {failed ? <MapFallback /> : null}

        {!failed ? (
          <MapControls
            exploring={exploring}
            onToggleExplore={() => setExploring((value) => !value)}
            onReset={() => {
              setSelected(null);
              setExploring(false);
              resetView();
            }}
          />
        ) : null}

        {selected ? (
          <LocationPanel location={selected} onClose={closePanel} />
        ) : null}
      </div>
    </div>
  );
}

function MapControls({
  exploring,
  onToggleExplore,
  onReset,
}: {
  exploring: boolean;
  onToggleExplore: () => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute top-4 left-4 z-[500] flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onToggleExplore}
        aria-pressed={exploring}
        className={`rounded-full border px-4 py-2 text-xs tracking-[0.12em] uppercase shadow-paper transition-colors duration-200 ${
          exploring
            ? "border-forest bg-forest text-paper"
            : "border-rule bg-paper text-forest hover:border-forest"
        }`}
      >
        {exploring ? "Exploring" : "Explore map"}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-full border border-rule bg-paper px-4 py-2 text-xs tracking-[0.12em] text-forest uppercase shadow-paper transition-colors duration-200 hover:border-forest"
      >
        View all
      </button>
    </div>
  );
}

/** Shown when the tile service cannot be reached — never a broken frame. */
function MapFallback() {
  return (
    <div className="absolute inset-0 z-[600] flex items-center justify-center bg-paper-deep px-8 text-center">
      <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
        The map could not be loaded just now. Every location, with its full
        description, is listed below.
      </p>
    </div>
  );
}

/** Side panel on desktop, bottom sheet on mobile — as the brief specified. */
function LocationPanel({
  location,
  onClose,
}: {
  location: HeritageLocation;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label={location.name}
      className="absolute inset-x-0 bottom-0 z-[600] max-h-[75%] overflow-y-auto border-t border-rule bg-paper p-6 shadow-lift sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[22rem] sm:border-t-0 sm:border-l sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex items-center gap-2 text-[0.6rem] tracking-[0.25em] text-gold-deep uppercase">
          {location.category}
          <span aria-hidden className="h-px w-5 bg-gold/50" />
          {location.period}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close and return to the map"
          className="-mt-1 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-forest/5 hover:text-forest"
        >
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      </div>

      <h3 className="mt-4 font-serif text-2xl tracking-tight text-forest">
        {location.name}
      </h3>
      <p className="mt-1 text-xs text-ink-muted">{location.address}</p>

      {location.image ? (
        <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden border border-rule">
          <Image
            src={location.image.src}
            alt={location.image.alt}
            fill
            sizes="(min-width: 640px) 22rem, 90vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <p className="mt-5 text-sm leading-relaxed text-ink-muted">
        {location.description}
      </p>

      {location.source ? (
        <p className="mt-4 text-xs leading-relaxed text-ink-muted/80 italic">
          Source:{" "}
          {location.source.href ? (
            <a
              href={location.source.href}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-gold/50 underline-offset-4"
            >
              {location.source.label}
            </a>
          ) : (
            location.source.label
          )}
        </p>
      ) : null}

      {location.readMore ? (
        <a
          href={location.readMore.href}
          className="mt-6 inline-flex text-sm text-forest underline decoration-gold/50 underline-offset-4"
        >
          {location.readMore.label}
        </a>
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className="mt-7 w-full rounded-full border border-forest/25 px-5 py-2.5 text-sm text-forest transition-colors duration-200 hover:border-forest hover:bg-forest/5"
      >
        Back to the map
      </button>
    </div>
  );
}
