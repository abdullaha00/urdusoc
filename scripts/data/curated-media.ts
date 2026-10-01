/**
 * Society-owned Instagram media selected for the site.
 *
 * The current committee uses its complete announcement cards, including the
 * society's typography and decorative design. Gallery entries link to the
 * original Instagram videos; the videos themselves are not copied into Blob.
 *
 * Each reel album does carry its cover - the still Instagram already serves
 * for the post, archived by `npm run instagram:archive`. It is published as the
 * album's thumbnail so the gallery shows the evening rather than a drawn
 * placeholder. This is the post's own cover, not a frame cut out of the mp4:
 * the video stays where it was published.
 */

export type ImageAsset = {
  kind: "originalImage";
  sourceFile: string;
  pathname: string;
  outputWidth: number;
  outputHeight: number;
};

export type CommitteePortrait = {
  academicYear: string;
  name: string;
  asset: ImageAsset;
};

export type GalleryAlbum = {
  slug: string;
  title: string;
  description: string;
  eventSlug: string;
  takenOn: string;
  motif: "mushaira" | "chai" | "calligraphy";
  reelUrl: string;
  /**
   * The reel's own cover still, shown as the album thumbnail.
   *
   * `alt` describes the frame rather than repeating the title, which the tile
   * already prints underneath - the same rule the event posters follow.
   */
  cover: { sourceFile: string; alt: string };
};

const portrait = (
  name: string,
  sourceFile: string,
  pathname: string,
): CommitteePortrait => ({
  academicYear: "2026–27",
  name,
  asset: {
    kind: "originalImage",
    sourceFile,
    pathname,
    outputWidth: 1080,
    outputHeight: 1350,
  },
});

export const committeePortraits: CommitteePortrait[] = [
  portrait(
    "Zayna Mian",
    "2026-09-28-Dd1P2CmjVA1-01.jpg",
    "committee/2026-27/zayna-mian-card.jpg",
  ),
  portrait(
    "Aahad Saddat",
    "2026-09-28-Dd1QEVxjUBE-01.jpg",
    "committee/2026-27/aahad-saddat-card.jpg",
  ),
  portrait(
    "Abdullah Akram",
    "2026-09-28-Dd1QSwADWWT-01.jpg",
    "committee/2026-27/abdullah-akram-card.jpg",
  ),
  portrait(
    "Daheem Khan",
    "2026-09-28-Dd1QiTgDX9B-01.jpg",
    "committee/2026-27/daheem-khan-card.jpg",
  ),
];

export const galleryAlbums: GalleryAlbum[] = [
  {
    slug: "bazm-e-adab-shayari-2022",
    title: "Bazm-e-Adab - Shayari in the Gardens",
    description:
      "Students gathered in Selwyn College Gardens for the year's final reading circle, with shayari, conversation and snacks on the lawn.",
    eventSlug: "bazm-e-adab-shayari-2022-06-11",
    takenOn: "2022-06-11",
    motif: "mushaira",
    reelUrl: "https://www.instagram.com/p/CesxZLaooP1/",
    cover: {
      sourceFile: "2022-06-12-CesxZLaooP1-01.jpg",
      alt: "A clear evening sky above the treetops of a college garden, with the moon already out. The Urdu words بزمِ ادب and the date 11.6.22 are set across the lower frame.",
    },
  },
  {
    slug: "poetry-on-the-river-2023",
    title: "Poetry on the River",
    description:
      "After three punts carried poems along the Cam, members gathered for a picnic beside the St John's Cripps moorings.",
    eventSlug: "poetry-on-the-river-2023-06-17",
    takenOn: "2023-06-17",
    motif: "mushaira",
    reelUrl: "https://www.instagram.com/p/Ctmp5JgAKIK/",
    cover: {
      sourceFile: "2023-06-17-Ctmp5JgAKIK-01.jpg",
      alt: "A punt drawing in beside a boathouse on the Cam, two passengers seated in the bow and the chauffeur standing at the stern with the pole, the view framed by overhanging plane leaves.",
    },
  },
  {
    slug: "faiz-progressive-writers-teach-in-2026",
    title: "Faiz and the Progressive Writers' Movement",
    description:
      "A Sunday teach-in on resistance through poetry and the Progressive Writers' Movement, led in the Munby Room at King's College.",
    eventSlug:
      "the-progressive-writers-association-faiz-ahmed-faiz-2026-02-15",
    takenOn: "2026-02-15",
    motif: "calligraphy",
    reelUrl: "https://www.instagram.com/p/DU0CApTDZz3/",
    cover: {
      sourceFile: "2026-02-16-DU0CApTDZz3-01.jpg",
      alt: "A speaker mid-sentence in a yellow-walled seminar room, hands raised, a laptop open on the desk beside him. The frame is captioned 'Faiz & the Progressive Writer's association - An UrduSoc Teach-in'.",
    },
  },
];

/**
 * Where an album's cover lands in Blob. Deterministic, so re-running the upload
 * replaces the file rather than accumulating copies of it.
 */
export function coverPathname(albumSlug: string): string {
  return `gallery/${albumSlug}/cover.jpg`;
}

/** Reel covers at the size Instagram serves them - portrait, 9:16. */
const COVER_WIDTH = 720;
const COVER_HEIGHT = 1280;

export const galleryCoverAssets: ImageAsset[] = galleryAlbums.map((album) => ({
  kind: "originalImage",
  sourceFile: album.cover.sourceFile,
  pathname: coverPathname(album.slug),
  outputWidth: COVER_WIDTH,
  outputHeight: COVER_HEIGHT,
}));

export const curatedMediaAssets: ImageAsset[] = [
  ...committeePortraits.map((member) => member.asset),
  ...galleryCoverAssets,
];
