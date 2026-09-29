"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { joinCta, navLinks, society } from "@/lib/content";
import { ButtonLink, Urdu } from "@/components/ui";

const navLinkBase =
  "relative text-sm transition-colors duration-200 hover:text-forest after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-200 after:content-['']";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md">
      {/*
        Navigation only. The society's full name and its SU affiliation used to
        sit in a bar above this; both now live in the footer, where there is
        room to set them properly — see the affiliation lockup in
        src/components/site-footer.tsx.
      */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 border-b border-rule/80 px-5 sm:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3"
          aria-label={`${society.name} — home`}
        >
          {/* Decorative: the link is already labelled, and the crest's arched
              lettering is unreadable at this size — the wordmark names us. */}
          <Image
            src="/logo.png"
            alt=""
            aria-hidden
            width={34}
            height={34}
            priority
            className="size-[34px] shrink-0"
          />
          <span className="font-serif text-xl leading-none font-semibold tracking-tight text-forest">
            {society.shortName}
          </span>
          <span aria-hidden className="h-4 w-px bg-rule" />
          <Urdu className="text-sm leading-none text-gold-deep">اردو</Urdu>
        </Link>

        <div className="flex items-center gap-6">
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-5">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`${navLinkBase} ${
                        active
                          ? "text-forest after:scale-x-100"
                          : "text-ink-muted after:scale-x-0 hover:after:scale-x-100"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hidden lg:block">
            <ButtonLink href={joinCta.primaryCta.href} className="px-5 py-2.5">
              {joinCta.primaryCta.label}
            </ButtonLink>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-full text-forest transition-colors duration-200 hover:bg-forest/5 lg:hidden"
          >
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <path d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="site-menu"
        hidden={!menuOpen}
        className="border-t border-rule bg-paper lg:hidden"
      >
        <nav aria-label="Primary (mobile)" className="px-5 py-4 sm:px-8">
          <ul className="flex flex-col">
            {navLinks.map((link) => (
              <li
                key={link.href}
                className="border-b border-rule/60 last:border-0"
              >
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className="block py-3 text-base text-ink transition-colors duration-200 hover:text-forest aria-[current=page]:text-forest"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink
            href={joinCta.primaryCta.href}
            onClick={() => setMenuOpen(false)}
            className="mt-5 w-full"
          >
            {joinCta.primaryCta.label}
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
