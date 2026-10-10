import type { Metadata } from "next";
import { VerseSpread } from "@/components/featured-urdu";
import { Diamond, PageHeader, SectionLabel, Urdu } from "@/components/ui";
import { getVerseArchive } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Urdu & Poetry",
  description:
    "Couplets, transliteration and translation from the Cambridge University Urdu Society - plus where to start if you are learning.",
};

const learningResources = [
  {
    name: "Aamozish",
    focus: "Urdu script",
    href: "https://rekhtalearning.com/aamozish/",
  },
  {
    name: "Let's Learn Urdu",
    focus: "Textbook PDF",
    href: "https://www.urducouncil.nic.in/sites/default/files/2024-07/Let%27s%20Learn%20Urdu%20%28English%29.pdf",
  },
  {
    name: "UrduPod101",
    focus: "Audio & video",
    href: "https://www.urdupod101.com/",
  },
  {
    name: "Rekhta Dictionary",
    focus: "Words & pronunciation",
    href: "https://www.rekhta.org/Dictionary",
  },
] as const;

// Hidden for now, alongside the "If you are just starting" section below.
// const startingPoints = [
//   {
//     title: "Come to a mushaira",
//     body: "Every piece is introduced in English before it is read. You do not need a word of Urdu to enjoy an evening of it.",
//   },
//   {
//     title: "Learn the script",
//     body: "We run beginner sessions on the Nastaliq alphabet each Michaelmas - the letters first, then joining them, then your own name.",
//   },
//   {
//     title: "Read alongside",
//     body: "We pair each verse we study with a transliteration and a translation, so you can follow the sound and the sense together.",
//   },
// ];

export default async function UrduPage() {
  const verses = await getVerseArchive();
  const [featured, ...archive] = verses;

  return (
    <>
      <PageHeader
        titleUrdu="زبان، ادب"
        title="The language, and what people have made with it."
        intro="Urdu carries one of the great poetic traditions: the ghazal, the nazm, the couplet that turns on a single word."
      />

      {featured ? (
        <section className="border-b border-rule/70 bg-paper-deep">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
            <SectionLabel as="h2" trailingRule className="text-ink-muted">
              This term&rsquo;s verse
            </SectionLabel>
            <VerseSpread verse={featured} />
          </div>
        </section>
      ) : null}

      {archive.length > 0 ? (
        <section className="border-b border-rule/70">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
            <SectionLabel as="h2" trailingRule className="text-ink-muted">
              From the archive
            </SectionLabel>

            <ul className="mt-12 space-y-16">
              {archive.map((verse) => (
                <li key={verse.id}>
                  <figure className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
                    <blockquote
                      lang="ur"
                      dir="rtl"
                      className="urdu space-y-3 text-center text-[1.1rem] leading-[2.3] text-forest sm:text-xl lg:text-left"
                    >
                      {verse.urduLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </blockquote>

                    <div>
                      <p className="font-serif leading-relaxed text-ink-muted italic">
                        {verse.transliterationLines.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed whitespace-pre-line">
                        {verse.translation}
                      </p>
                      <figcaption className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-medium">{verse.poetName}</span>
                        {verse.poetUrdu ? (
                          <>
                            <Diamond className="opacity-70" />
                            <Urdu className="text-gold-deep">
                              {verse.poetUrdu}
                            </Urdu>
                          </>
                        ) : null}
                        {verse.poetYears ? (
                          <span className="text-ink-muted">
                            {verse.poetYears}
                          </span>
                        ) : null}
                      </figcaption>
                    </div>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section id="resources" className="border-b border-rule/70 bg-paper-deep">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-16">
          <div className="flex items-center gap-6">
            <SectionLabel as="h2" className="shrink-0 text-ink-muted">
              Learn Urdu
            </SectionLabel>
            <Urdu className="ml-auto text-lg text-gold-deep">
              اردو سیکھیں
            </Urdu>
          </div>

          <ul className="mt-8 grid border-t border-l border-rule sm:grid-cols-2">
            {learningResources.map((resource) => (
              <li key={resource.name} className="border-r border-b border-rule">
                <a
                  href={resource.href}
                  className="group flex min-h-24 items-center justify-between gap-5 bg-paper/35 px-5 py-4 transition-colors duration-200 hover:bg-paper sm:px-6"
                >
                  <span>
                    <span className="block font-serif text-xl tracking-tight text-forest">
                      {resource.name}
                    </span>
                    <span className="mt-1 block text-[0.65rem] font-medium tracking-[0.18em] text-ink-muted uppercase">
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

      {/* Hidden for now.
      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <SectionLabel as="h2" trailingRule className="text-ink-muted">
            If you are just starting
          </SectionLabel>

          <ul className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-rule">
            {startingPoints.map((point, index) => (
              <li key={point.title} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
                <span className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-gold-deep">
                  {String(index + 1).padStart(2, "0")}
                  <span aria-hidden className="h-px w-6 bg-gold/60" />
                </span>
                <h3 className="mt-3 font-serif text-xl tracking-tight text-forest">
                  {point.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {point.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      */}
    </>
  );
}
