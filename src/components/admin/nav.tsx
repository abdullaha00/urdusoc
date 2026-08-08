"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Sections of the admin, in the order a committee actually works through them. */
const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/verses", label: "Verses" },
  { href: "/admin/committee", label: "Committee" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/subscribers", label: "Mailing list" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  // "/admin" would otherwise match every child route.
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav aria-label="Admin sections">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {ADMIN_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-sm px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "bg-forest/10 font-medium text-forest"
                    : "text-ink-muted hover:bg-rule/40 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
