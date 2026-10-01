import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { EXTERNAL_LINKS, footer, footerGroups, society } from "@/lib/content";
import { Urdu } from "@/components/ui";

const footerLinkClasses =
  "text-sm text-ink underline decoration-transparent underline-offset-4 transition-colors duration-200 hover:text-forest hover:decoration-gold";

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={footerLinkClasses}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={footerLinkClasses}>
      {children}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-paper-deep">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Decorative - the society's name is spelled out directly below. */}
            <Image
              src="/logo.png"
              alt=""
              aria-hidden
              width={72}
              height={72}
              className="mb-5 size-[72px]"
            />
            <p className="font-serif text-xl leading-snug tracking-tight text-forest">
              {society.name}
            </p>
            {/* inline-block, not block: the span is RTL, so as a block it would
                take the column's full width and the name would sit flush right,
                adrift from the English line above it. */}
            <Urdu className="mt-1 inline-block text-lg text-gold-deep">
              {society.nameUrdu}
            </Urdu>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">
              {footer.blurb}
            </p>

            {/*
              Affiliation, moved down from the old header identity bar.

              The mark in public/su-logo.svg is a stand-in: the SU's logo is
              theirs to license, so ask them for the file and save it over that
              one. The wording holds either way.

              Deliberately the SU and not the University crest - the University
              restricts its arms and name-marks, and a student society needs
              written permission it does not currently have.
            */}
            <a
              href={EXTERNAL_LINKS.cambridgeSu}
              className="group mt-8 inline-flex items-center gap-3.5 border-t border-rule pt-3 transition-colors duration-200 hover:text-wine"
            >
              {/* Decorative: the affiliation is spelled out alongside it. */}
              <Image
                src="/su-logo.svg"
                alt=""
                aria-hidden
                width={36}
                height={36}
                className="size-9 shrink-0"
              />
              <span className="text-[0.62rem] leading-[1.7] tracking-[0.2em] text-ink-muted uppercase transition-colors duration-200 group-hover:text-forest">
                A registered
                <br />
                Cambridge SU society
              </span>
            </a>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-[0.62rem] tracking-[0.25em] text-ink-muted uppercase">
                {group.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">{footer.copyright}</p>
          <Urdu className="text-sm text-gold-deep">{footer.motto}</Urdu>
        </div>
      </div>
    </footer>
  );
}
