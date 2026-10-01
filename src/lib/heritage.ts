/**
 * Places in Cambridge with a thread to Urdu literary history.
 *
 * Kept as a data file rather than a database table on purpose. These are
 * historical facts, not society business: they change roughly never, they are
 * not a committee's to edit casually, and holding them in the repository means
 * every change is reviewed and has an author. Adding a location is one entry
 * below; nothing else needs touching.
 *
 * ⚠️ SOURCING. The first four entries came from the 2026 committee's brief,
 * which did its own research but was not itself referenced; each has since been
 * given a `source`, and the Emmanuel entry was corrected in the process - it
 * had Rahmat Ali buried at the college, which he is not. Keep that standard:
 * nothing goes in without a citable source, and where a claim is contested or
 * traditional rather than documented, say so in `description` - the hedging in
 * the Humberstone Road entry is deliberate and should not be tidied away.
 *
 * Coordinates are from OpenStreetMap's own geocoder rather than eyeballed off a
 * map, so a pin and the basemap under it agree about where a building is.
 */

export type HeritageCategory =
  | "College"
  | "Residence"
  | "Literary Landmark"
  | "Resting Place"
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
      "Allama Muhammad Iqbal came up to Trinity in September 1905 as an Advanced Student and stayed two years, reading Moral Sciences - the name philosophy went by here then - under the neo-Hegelian J. M. E. McTaggart. He submitted his dissertation, The Development of Metaphysics in Persia, in March 1907 and took his BA by research with distinction that June, before moving on to Munich for his doctorate. He is the reason this society has a thread to Cambridge at all: the poet who shaped modern Urdu verse spent two formative years a few streets from where we now meet.",
    lat: 52.20689,
    lng: 0.11511,
    source: {
      label: "“Iqbal at Cambridge”, Iqbal Review",
      href: "https://www.allamaiqbal.com/publications/journals/review/oct08/5.htm",
    },
  },
  {
    id: "portugal-place",
    name: "17 Portugal Place",
    address: "Portugal Place, Cambridge CB5 8AF",
    category: "Residence",
    period: "1905–06",
    description:
      "Iqbal's lodgings while at Trinity. A plaque on the house records it: “Allama Muhammad Iqbal / Born 1877 Died 1938 / Poet-Philosopher of Pakistan / Lived here 1905-6 while at Trinity College”. A narrow terraced street behind the Round Church, close enough to college to walk in minutes - the ordinary domestic setting behind a name that is now recited across South Asia.",
    lat: 52.20962,
    lng: 0.11882,
    source: {
      label: "Capturing Cambridge, Museum of Cambridge",
      href: "https://capturingcambridge.org/centre/portugal-place/17-portugal-place/",
    },
  },
  {
    id: "emmanuel-college",
    name: "Emmanuel College",
    address: "St Andrew's Street, Cambridge CB2 3AP",
    category: "College",
    period: "from 1931",
    description:
      "Choudhry Rahmat Ali joined Emmanuel in 1931 to read law, taking his BA in 1933 and an MA in 1940. When he died in Cambridge in 1951, insolvent, the college paid for his funeral on the instruction of its Master, Edward Welbourne; he is buried not here but at the city cemetery out on Newmarket Road. Emmanuel is the second of the two colleges around which this city's Urdu history turns.",
    lat: 52.20368,
    lng: 0.12518,
    source: {
      label: "Choudhry Rahmat Ali, Wikipedia",
      href: "https://en.wikipedia.org/wiki/Choudhry_Rahmat_Ali",
    },
  },
  {
    id: "humberstone-road",
    name: "3 Humberstone Road",
    address: "Humberstone Road, Cambridge CB4 1JD",
    category: "Literary Landmark",
    period: "1932–33",
    description:
      "The house Rahmat Ali moved to in 1932. It is said to be where he first wrote the name \"Pakstan\", in the pamphlet Now or Never, dated 28 January 1933 - a claim repeated often enough to have become local tradition, though the documentary record is thinner than the retelling suggests. Either way, the pamphlet was written in Cambridge, in a rented room on an ordinary residential street.",
    lat: 52.21368,
    lng: 0.13259,
    source: {
      label: "Choudhry Rahmat Ali, Wikipedia",
      href: "https://en.wikipedia.org/wiki/Choudhry_Rahmat_Ali",
    },
  },
  {
    id: "cambridge-city-cemetery",
    name: "Cambridge City Cemetery",
    address: "Newmarket Road, Cambridge CB5 8PE",
    category: "Resting Place",
    period: "1951",
    description:
      "Rahmat Ali died on 3 February 1951 and was buried here on the 20th, in section 16. He had spent most of his adult life in Cambridge and died with nothing; the grave is three miles east of the Emmanuel gate, at the edge of the city, past the airport. Of everything on this map it is the easiest to visit and the least visited.",
    lat: 52.21317,
    lng: 0.16911,
    source: {
      label: "Choudhry Rahmat Ali, Wikipedia",
      href: "https://en.wikipedia.org/wiki/Choudhry_Rahmat_Ali",
    },
  },
  {
    id: "university-library",
    name: "Cambridge University Library",
    address: "West Road, Cambridge CB3 9DR",
    category: "Urdu History",
    period: "Ongoing",
    description:
      "The Library's Islamicate manuscript collections run to more than seven thousand volumes in Arabic, Persian, Turkish, Pashto and Urdu. The Urdu holdings are among the smaller of those and are catalogued largely inside the Persian and \"Muhammadan\" hand-lists rather than under their own heading, which is its own small piece of history. They are ordered up to the Manuscripts Reading Room like anything else: the material is here, in the tower at the end of West Road, and it can be read.",
    lat: 52.20507,
    lng: 0.10772,
    source: {
      label: "Near and Middle Eastern Department, Cambridge University Library",
      href: "https://www.lib.cam.ac.uk/collections/departments/near-and-middle-eastern-department/manuscript-collections-catalogues",
    },
  },
  {
    id: "centre-of-south-asian-studies",
    name: "Centre of South Asian Studies",
    address: "Alison Richard Building, 7 West Road, Cambridge CB3 9DT",
    category: "Urdu History",
    period: "Present day",
    description:
      "Urdu is still taught in Cambridge. The Centre runs language training at beginner and intermediate level in Hindi and Urdu for its MPhil in Modern South Asian Studies, taught through the Faculty of Asian and Middle Eastern Studies. It is the one pin here that is not history: a hundred and twenty years after Iqbal sat his Moral Sciences papers, the language is still on a timetable a few hundred yards away.",
    lat: 52.20243,
    lng: 0.10918,
    source: {
      label: "MPhil in Modern South Asian Studies handbook, 2025–26",
      href: "https://www.s-asian.cam.ac.uk/wp-content/uploads/2025/10/MPhil-CSAS-Handbook-2025-26-v2.pdf",
    },
  },
  {
    id: "central-mosque",
    name: "Cambridge Central Mosque",
    address: "309–313 Mill Road, Cambridge CB1 3DF",
    category: "Urdu History",
    period: "opened 2019",
    description:
      "Not a literary site, and newer than everything else here by eighty years. It is on the map because the city's Urdu-speaking life now has a building of its own: the first purpose-built mosque in Cambridge, opened in April 2019, used as a community hall as much as a prayer hall. The rest of this map is individuals in rented rooms. This is the part that happened to a community.",
    lat: 52.19732,
    lng: 0.15238,
    source: {
      label: "Cambridge Central Mosque",
      href: "https://cambridgecentralmosque.org/",
    },
  },
];

/**
 * The curated viewing area - Girton in the north, Homerton in the south, as the
 * brief specified. The map may not be panned outside it, so the historical
 * locations are never left off screen.
 */
export const CAMBRIDGE_BOUNDS = {
  north: 52.228268,
  south: 52.186161,
  // Widened twice now, both times because a pin sat on the edge of the pannable
  // area: first off the two college longitudes, then east again for the city
  // cemetery, which is three miles out past the airport.
  west: 0.05,
  east: 0.19,
} as const;

/**
 * The tightest box containing every location. Derived rather than written down,
 * because the opening view is fitted to it - the previous hardcoded centre and
 * zoom silently left the cemetery pin off screen the moment it was added, and a
 * computed box cannot do that again.
 */
export const LOCATIONS_BOUNDS = {
  south: Math.min(...HERITAGE_LOCATIONS.map((location) => location.lat)),
  north: Math.max(...HERITAGE_LOCATIONS.map((location) => location.lat)),
  west: Math.min(...HERITAGE_LOCATIONS.map((location) => location.lng)),
  east: Math.max(...HERITAGE_LOCATIONS.map((location) => location.lng)),
};

/** Initial centre, before the view is fitted to {@link LOCATIONS_BOUNDS}. */
export const CAMBRIDGE_CENTRE = { lat: 52.2055, lng: 0.1295, zoom: 14 } as const;

/** Zoom used when a single location is opened. */
export const LOCATION_ZOOM = 17;
