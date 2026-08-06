import Link from "next/link";
import type { ReactNode } from "react";
import { footer, footerGroups, society } from "@/lib/content";
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
            <p className="font-serif text-xl leading-snug tracking-tight text-forest">
              {society.name}
            </p>
            <Urdu className="mt-1 block text-lg text-gold-deep">
              {society.nameUrdu}
            </Urdu>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">
              {footer.blurb}
            </p>
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
