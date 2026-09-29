/**
 * Admin chrome.
 *
 * Plainer than the public site on purpose: this is a working tool for the
 * committee, so density and legibility beat atmosphere. It still uses the same
 * tokens from globals.css so it does not feel like a different website.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { buttonBase, buttonVariants } from "@/components/ui";

export function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel,
  action,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-rule/70 pb-6">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-3 inline-block text-xs tracking-[0.18em] text-ink-muted uppercase transition-colors hover:text-forest"
        >
          ← {backLabel ?? "Back"}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl leading-tight tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

/** Shown in place of a table that has no rows. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-rule px-6 py-12 text-center text-sm text-ink-muted">
      {children}
    </div>
  );
}

/** Tables are the whole point of an admin, so they get to scroll on their own. */
export function AdminTable({
  head,
  children,
}: {
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-sm border border-rule">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead className="bg-paper-deep/60">
          <tr className="text-left">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-[0.65rem] font-medium tracking-[0.18em] text-ink-muted uppercase ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td className={`border-t border-rule/70 px-4 py-3 align-middle ${className}`}>
      {children}
    </td>
  );
}

const badgeBase =
  "inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.12em] uppercase";

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-rule/50 text-ink-muted",
    good: "bg-forest/10 text-forest",
    warn: "bg-gold/15 text-gold-deep",
    bad: "bg-wine/10 text-wine",
  } as const;

  return <span className={`${badgeBase} ${tones[tone]}`}>{children}</span>;
}

export function PublishBadge({ published }: { published: boolean }) {
  return (
    <Badge tone={published ? "good" : "warn"}>
      {published ? "Live" : "Draft"}
    </Badge>
  );
}

/** Dashboard tile. `href` makes the whole tile a link. */
export function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-[0.65rem] font-medium tracking-[0.18em] text-ink-muted uppercase">
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs text-ink-muted">{hint}</p> : null}
    </>
  );

  const classes =
    "block rounded-sm border border-rule bg-paper px-5 py-5 transition-colors";

  return href ? (
    <Link href={href} className={`${classes} hover:border-gold/60`}>
      {inner}
    </Link>
  ) : (
    <div className={classes}>{inner}</div>
  );
}

export function AdminButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${buttonBase} ${buttonVariants[variant]} px-5 py-2.5 text-xs`}
    >
      {children}
    </Link>
  );
}
