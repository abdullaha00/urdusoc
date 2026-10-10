import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Resources",
  description: "Two online resources for learning to read, write and speak Urdu.",
};

const resources = [
  {
    name: "Zer o Zabar",
    focus: "Read & write",
    href: "https://zerozabar.com/",
  },
  {
    name: "UrduPod101",
    focus: "Listen & speak",
    href: "https://www.youtube.com/channel/UCGiKlOBHnhWnb2hv6IVOb4w",
  },
] as const;

export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        titleUrdu="اردو سیکھیں"
        title="Resources for learning Urdu."
        intro="Start with the script, or learn through audio."
      />

      <section
        aria-label="Learning resources"
        className="border-b border-rule/70 bg-paper-deep"
      >
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-16">
          <ul className="grid border-t border-l border-rule sm:grid-cols-2">
            {resources.map((resource) => (
              <li key={resource.name} className="border-r border-b border-rule">
                <a
                  href={resource.href}
                  className="group flex min-h-32 items-center justify-between gap-5 bg-paper/35 px-5 py-6 transition-colors duration-200 hover:bg-paper sm:px-7"
                >
                  <span>
                    <span className="block font-serif text-2xl tracking-tight text-forest">
                      {resource.name}
                    </span>
                    <span className="mt-1.5 block text-[0.65rem] font-medium tracking-[0.18em] text-ink-muted uppercase">
                      {resource.focus}
                    </span>
                  </span>
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="size-4 shrink-0 text-gold-deep transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 15 15 5M7 5h8v8" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
