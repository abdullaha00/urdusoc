import Link from "next/link";
import type { ReactNode } from "react";
import { JaliArch, JaliScreen } from "@/components/jali";

/** Internal routes get client-side navigation; anything else is a plain link. */
function isInternal(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

/** Urdu text, always tagged for language and right-to-left rendering. */
export function Urdu({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span lang="ur" dir="rtl" className={`urdu ${className}`}>
      {children}
    </span>
  );
}

/** Small tracked-out eyebrow, optionally preceded by a gold hairline. */
export function SectionLabel({
  as: Tag = "p",
  children,
  rule = true,
  trailingRule = false,
  className = "",
}: {
  /** Use "h2" when the label is the section's real heading. */
  as?: "p" | "h2";
  children: ReactNode;
  rule?: boolean;
  trailingRule?: boolean;
  className?: string;
}) {
  return (
    <Tag
      className={`flex items-center gap-3 text-[0.7rem] font-medium tracking-[0.28em] uppercase ${className}`}
    >
      {rule ? <span aria-hidden className="h-px w-8 shrink-0 bg-gold" /> : null}
      {children}
      {trailingRule ? (
        <span aria-hidden className="h-px flex-1 bg-rule" />
      ) : null}
    </Tag>
  );
}

/** Gold lozenge used as a quiet divider between blocks of text. */
export function Diamond({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-1.5 rotate-45 bg-gold ${className}`}
    />
  );
}

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55";

export const buttonVariants = {
  primary: "bg-forest text-paper hover:bg-forest-soft",
  /*
    The border carries the whole button - there is no fill to read as an edge -
    so it has to clear 3:1 against paper, the WCAG minimum for a UI boundary.
    forest/60 samples 3.31:1 on the archive ground and 3.12:1 on heritage, both
    measured off a render rather than computed - Tailwind mixes the alpha in
    oklab, which costs about 0.2 against the sRGB figure. The /25 it used to be
    was 1.59:1, which left the hero's Instagram button looking like bare text.
    Heritage has little headroom: re-measure both grounds if you lower this.
  */
  outline:
    "border border-forest/60 text-forest hover:border-forest hover:bg-forest/5",
  light: "bg-paper text-wine-deep hover:bg-white",
  danger: "border border-wine/30 text-wine hover:border-wine hover:bg-wine/5",
} as const;

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  onClick,
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  className?: string;
  /** Only usable from client components - e.g. closing the mobile menu. */
  onClick?: () => void;
  children: ReactNode;
}) {
  const classes = `${buttonBase} ${buttonVariants[variant]} ${className}`;

  if (isInternal(href)) {
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} onClick={onClick} className={classes}>
      {children}
    </a>
  );
}

/** Understated text link with an arrow that nudges forward on hover. */
export function ArrowLink({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const classes = `group inline-flex items-center gap-2 text-sm font-medium underline decoration-current/30 underline-offset-4 transition-colors duration-200 hover:decoration-current ${className}`;

  const content = (
    <>
      {children}
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
      </svg>
    </>
  );

  if (isInternal(href)) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} className={classes}>
      {content}
    </a>
  );
}

/**
 * Masthead for interior pages, with the title as the first visible content.
 *
 * The jali arch is anchored to the top-left of the text column rather than the
 * page centre, so the heading sits inside the opening at every width instead of
 * drifting out of it on wide screens.
 */
export function PageHeader({
  title,
  titleUrdu,
  intro,
  children,
}: {
  title: string;
  titleUrdu?: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="paper-wash relative overflow-hidden border-b border-rule/70">
      <JaliScreen className="text-forest" opacity={0.04} />

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <JaliArch className="-top-10 left-0 h-[24rem] w-[22rem] text-forest sm:h-[28rem] sm:w-[27rem]" />

        <div className="relative">
          {titleUrdu ? (
            <Urdu className="mt-6 inline-block text-3xl leading-[1.6] text-forest sm:text-4xl">
              {titleUrdu}
            </Urdu>
          ) : null}

          <h1
            className={`${titleUrdu ? "mt-2" : ""} max-w-3xl font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl`}
          >
            {title}
          </h1>

          {intro ? (
            <p className="mt-6 max-w-xl leading-relaxed text-ink-muted">
              {intro}
            </p>
          ) : null}

          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
