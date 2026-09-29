/**
 * Places in Cambridge with a thread to Urdu literary history.
 *
 * Kept as a data file rather than a database table on purpose. These are
 * historical facts, not society business: they change roughly never, they are
 * not a committee's to edit casually, and holding them in the repository means
 * every change is reviewed and has an author. Adding a location is one entry
 * below; nothing else needs touching.
 *
 * ⚠️ SOURCING. Every entry here came from the 2026 committee's brief, which
 * did its own research but was not itself referenced. The Iqbal lodgings entry
 * cites the Museum of Cambridge's Capturing Cambridge archive; the others are
 * unattributed. Before this page goes public, someone should check each claim
 * against a citable source and fill in `source`. Where a claim is contested or
 * traditional rather than documented, say so in `description` — the hedging in
 * the Humberstone Road entry is deliberate and should not be tidied away.
 */

export type HeritageCategory =
  | "College"
  | "Residence"
  | "Literary Landmark"
  | "Urdu History";

export type HeritageLocation = {
  id: string;
  name: string;
  /** Postal address, shown under the name in the panel. */
  address: string;
  category: HeritageCategory;
  /** Free text, e.g. "1905–07". Shown as the period label. */
  period: string;
  /** Two to four sentences. Plain prose, no markup. */
  description: string;
  lat: number;
  lng: number;
  /** Where the claim comes from. Rendered as a citation when present. */
  source?: { label: string; href?: string };
  /** Optional image in /public. The panel is designed to work without one. */
  image?: { src: string; alt: string };
  /** Optional link out, for a fuller history page written later. */
  readMore?: { label: string; href: string };
};

export const HERITAGE_LOCATIONS: HeritageLocation[] = [
  {
    id: "trinity-college",
    name: "Trinity College",
    address: "Trinity Street, Cambridge CB2 1TQ",
    category: "College",
    period: "1905–07",
    description:
      "Allama Muhammad Iqbal came to Trinity in 1905 and stayed two years, reading philosophy before moving on to Munich for his doctorate. He is the reason this society has a thread to Cambridge at all: the poet who shaped modern Urdu verse spent two formative years a few streets from where we now meet.",
    lat: 52.20692,
    lng: 0.11691,
  },
  {
    id: "portugal-place",
    name: "17 Portugal Place",
    address: "Portugal Place, Cambridge",
    category: "Residence",
    period: "1905",
    description:
      "Iqbal's lodgings during his first year at Trinity. A narrow terraced street behind the Round Church, close enough to college to walk in minutes — the ordinary domestic setting behind a name that is now recited across South Asia.",
    lat: 52.20948,
    lng: 0.11864,
    source: {
      label: "Capturing Cambridge, Museum of Cambridge",
      href: "https://capturingcambridge.org/",
    },
  },
  {
    id: "emmanuel-college",
    name: "Emmanuel College",
    address: "St Andrew's Street, Cambridge CB2 3AP",
    category: "College",
    period: "from 1931",
    description:
      "Chaudhry Rahmat Ali joined Emmanuel in 1931 to read for the Law Tripos. He died in Cambridge and is buried here; the college met the costs of his funeral. Emmanuel is the second of the two colleges around which this city's Urdu history turns.",
    lat: 52.2036,
    lng: 0.1237,
  },
  {
    id: "humberstone-road",
    name: "3 Humberstone Road",
    address: "Humberstone Road, Cambridge CB4 1JD",
    category: "Literary Landmark",
    period: "1932–33",
    description:
      "The house Rahmat Ali moved to in 1932. It is said to be where he first wrote the name \"Pakstan\", in the 1933 pamphlet Now or Never — a claim repeated often enough to have become local tradition, though the documentary record is thinner than the retelling suggests. Either way, the pamphlet was written in Cambridge, in a rented room on an ordinary residential street.",
    lat: 52.2137,
    lng: 0.13261,
  },
];

/**
 * The curated viewing area — Girton in the north, Homerton in the south, as the
 * brief specified. The map may not be panned outside it, so the historical
 * locations are never left off screen.
 */
export const CAMBRIDGE_BOUNDS = {
  north: 52.228268,
  south: 52.186161,
  // Widened from the two college longitudes so the eastern pins are not pinned
  // against the edge of the pannable area.
  west: 0.06,
  east: 0.16,
} as const;

/** Opening view: all four pins comfortably in frame. */
export const CAMBRIDGE_CENTRE = { lat: 52.2075, lng: 0.1195, zoom: 14 } as const;

/** Zoom used when a single location is opened. */
export const LOCATION_ZOOM = 17;
