import { EVENT_CATEGORIES, HOSTING_LEGEND } from "@/lib/events";

/**
 * The key to the event categories, set as a museum wall panel.
 *
 * Two groups because there are two independent axes: what an evening *is*
 * (colour-coded) and who *hosts* it (not colour-coded, since a collaboration
 * can be any of the three).
 */
export function EventLegend() {
  return (
    <div className="border border-rule bg-paper-deep/60 p-6 sm:p-8">
      <h3 className="text-[0.62rem] tracking-[0.28em] text-ink-muted uppercase">
        Key
      </h3>

      <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-3">
        {Object.entries(EVENT_CATEGORIES).map(([id, category]) => (
          <div key={id} className="flex gap-3">
            <span
              aria-hidden
              className="mt-1.5 h-8 w-[3px] shrink-0"
              style={{ backgroundColor: category.swatch }}
            />
            <div>
              <dt
                className="text-[0.65rem] tracking-[0.22em] uppercase"
                style={{ color: category.swatch }}
              >
                {category.label}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {category.description}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <dl className="mt-7 grid gap-x-10 gap-y-4 border-t border-rule pt-6 sm:grid-cols-2">
        {HOSTING_LEGEND.map((entry) => (
          <div key={entry.label}>
            <dt className="text-[0.65rem] tracking-[0.22em] text-gold-deep uppercase">
              {entry.label}
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {entry.description}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
