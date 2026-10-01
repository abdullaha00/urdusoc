/**
 * The jali visual system - a pierced-screen lattice and a cusped arch.
 *
 * Drawn as original SVG geometry rather than tracing the reference photograph
 * the 2026 committee supplied. That photograph is deliberately not in the repo
 * - see the note in .gitignore. The 17th-century screen it showed is long out
 * of copyright, but the photograph of it is a separate work with its own
 * rights, and we hold no licence for it. Constructing the pattern from scratch
 * also costs a couple of kilobytes instead of 1.8 MB, scales to any size, and
 * picks up the palette tokens - so it follows the brief's own "SVG or flex
 * container graphic" rule into the bargain.
 *
 * The geometry is the overlapping-circle lattice common to Mughal jali work:
 * circles on a half-tile grid, whose intersections read as six-petal rosettes.
 *
 * Both components are decorative and are hidden from assistive technology.
 */

/**
 * Lattice tile. Circles sit every half-tile so the pattern repeats seamlessly
 * on all four edges - the radius equals the spacing, which is what makes
 * neighbouring circles cross at the petal points.
 */
const TILE = 32;
const RADIUS = 16;

const LATTICE_CENTRES = [0, 16, 32].flatMap((x) =>
  [0, 16, 32].map((y) => ({ x, y })),
);

/**
 * The repeating screen, for use as a page background.
 *
 * Deliberately far fainter than the arch: the brief asks for the background to
 * sit well below the arch in prominence, so this defaults to a very low opacity
 * and should generally be left there.
 */
export function JaliScreen({
  className = "",
  opacity = 0.05,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 size-full ${className}`}
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="jali-screen"
          width={TILE}
          height={TILE}
          patternUnits="userSpaceOnUse"
        >
          {LATTICE_CENTRES.map(({ x, y }) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#jali-screen)" />
    </svg>
  );
}

/**
 * Builds a cusped (multifoil) arch outline.
 *
 * The opening is a semicircle of radius `width / 2`; the scallops are arcs
 * strung between evenly spaced points on it, each bulging back towards the
 * centre so the cusps point inward - the profile in the reference screen.
 *
 * Returned as a single closed path so it can be used both as a stroke and as a
 * clip path.
 */
function archPath(width: number, height: number, lobes: number): string {
  const radius = width / 2;
  const centreX = width / 2;
  // Where the arch springs from - the straight jambs run below this line.
  const springY = height - radius * 0.55;

  const pointAt = (index: number) => {
    const angle = Math.PI - (index / lobes) * Math.PI;
    return {
      x: centreX + radius * Math.cos(angle),
      y: springY - radius * Math.sin(angle),
    };
  };

  // Chord between adjacent points; the lobe radius is a little over half of it
  // so each scallop is a shallow bulge rather than a half-circle.
  const chord = 2 * radius * Math.sin(Math.PI / (2 * lobes));
  const lobeRadius = chord * 0.62;

  const start = pointAt(0);
  const segments: string[] = [`M ${start.x.toFixed(2)} ${height.toFixed(2)}`];
  segments.push(`L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`);

  for (let i = 1; i <= lobes; i += 1) {
    const { x, y } = pointAt(i);
    // sweep-flag 0 bulges the arc towards the arch's centre, cutting the cusp.
    segments.push(
      `A ${lobeRadius.toFixed(2)} ${lobeRadius.toFixed(2)} 0 0 0 ${x.toFixed(2)} ${y.toFixed(2)}`,
    );
  }

  const end = pointAt(lobes);
  segments.push(`L ${end.x.toFixed(2)} ${height.toFixed(2)}`);
  segments.push("Z");

  return segments.join(" ");
}

const ARCH_WIDTH = 520;
const ARCH_HEIGHT = 460;
const ARCH_PATH = archPath(ARCH_WIDTH, ARCH_HEIGHT, 9);

/**
 * The arch that frames a page masthead.
 *
 * Scales with its container and is anchored to the top, so on a narrow screen
 * it crops from the bottom rather than shrinking away from the heading or
 * overlapping it - the failure the brief specifically called out.
 *
 * The whole thing dissolves downwards. A masthead's heading and standfirst sit
 * inside the opening, and at full strength the lattice ran straight through
 * them: dense one-pixel circles behind body copy is exactly the texture that
 * makes small text hard to read. Fading it out above the copy keeps the crown -
 * the part that actually reads as an arch - and hands the text clean paper.
 */
export function JaliArch({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${ARCH_WIDTH} ${ARCH_HEIGHT}`}
      preserveAspectRatio="xMidYMin slice"
      className={`pointer-events-none absolute ${className}`}
    >
      <defs>
        <pattern
          id="jali-arch-fill"
          width={TILE}
          height={TILE}
          patternUnits="userSpaceOnUse"
        >
          {LATTICE_CENTRES.map(({ x, y }) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
            />
          ))}
        </pattern>

        <clipPath id="jali-arch-clip">
          <path d={ARCH_PATH} />
        </clipPath>

        {/* Full strength across the crown, gone by the time the copy starts. */}
        <linearGradient id="jali-arch-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity={1} />
          <stop offset="22%" stopColor="white" stopOpacity={0.85} />
          <stop offset="46%" stopColor="white" stopOpacity={0.3} />
          <stop offset="66%" stopColor="white" stopOpacity={0} />
        </linearGradient>

        <mask id="jali-arch-mask">
          <rect
            width={ARCH_WIDTH}
            height={ARCH_HEIGHT}
            fill="url(#jali-arch-fade)"
          />
        </mask>
      </defs>

      <g mask="url(#jali-arch-mask)">
        {/* Lattice, showing only within the arch opening. */}
        <g clipPath="url(#jali-arch-clip)" opacity={0.2}>
          <rect
            width={ARCH_WIDTH}
            height={ARCH_HEIGHT}
            fill="url(#jali-arch-fill)"
          />
        </g>

        {/* The arch outline itself, the most distinct element of the two. */}
        <path
          d={ARCH_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={0.5}
        />
      </g>
    </svg>
  );
}
