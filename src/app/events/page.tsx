import type { Metadata } from "next";
import { EventCard } from "@/components/event-card";
import { PageHeader, SectionLabel } from "@/components/ui";
import { getPastEvents, getUpcomingEvents } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Mushairas, chai socials, workshops and talks from the Cambridge University Urdu Society.",
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  return (
    <>
      <PageHeader
        label="Term card"
        title="What's on this term."
        titleUrdu="محفل"
        intro="Everything we run is open to members and non-members alike. Most evenings are free; where a ticket is needed, it is there to cover the room and the chai."
      />

      <section className="border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <SectionLabel as="h2" trailingRule className="text-ink-muted">
            Upcoming
          </SectionLabel>

          {upcoming.length > 0 ? (
            <ul className="mt-8 border-t border-rule">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </ul>
          ) : (
            <p className="mt-8 max-w-md leading-relaxed text-ink-muted">
              Nothing is scheduled at the moment. The term card usually goes up a
              week or two before term begins.
            </p>
          )}
        </div>
      </section>

      {past.length > 0 ? (
        <section className="bg-paper-deep">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
            <SectionLabel as="h2" trailingRule className="text-ink-muted">
              Previously
            </SectionLabel>

            <ul className="mt-8 border-t border-rule">
              {past.map((event) => (
                <EventCard key={event.id} event={event} muted />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
