"use client";

import { useActionState, useState } from "react";
import { saveEvent, type EventFormState } from "@/app/admin/events/actions";
import {
  Checkbox,
  Field,
  FormMessage,
  Input,
  Select,
  SubmitButton,
  Textarea,
} from "@/components/form";
import { slugify } from "@/lib/slug";
import type { Event } from "@/lib/db/schema";
import { toDateTimeLocalValue } from "@/lib/format";

const initialState: EventFormState = { status: "idle" };

const KINDS = [
  { value: "mushaira", label: "Mushaira" },
  { value: "social", label: "Social" },
  { value: "workshop", label: "Workshop" },
  { value: "talk", label: "Talk" },
] as const;

/** The colour axis. See EVENT_CATEGORIES for what each one means publicly. */
const CATEGORIES = [
  { value: "academic", label: "Academic — it teaches" },
  { value: "cultural", label: "Cultural — it performs" },
  { value: "social", label: "Social — it gathers" },
] as const;

export function EventForm({ event }: { event?: Event }) {
  const [state, formAction] = useActionState(saveEvent, initialState);

  // The slug follows the title until someone edits it by hand; after that it is
  // left alone, so an established URL is never changed by a title tweak.
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(event));
  const [ticketing, setTicketing] = useState(event?.ticketing ?? "none");
  const [isCollaboration, setIsCollaboration] = useState(
    event?.isCollaboration ?? false,
  );
  const [featured, setFeatured] = useState(event?.featured ?? false);
  const [posterUrl, setPosterUrl] = useState(event?.posterUrl ?? "");

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Title"
          htmlFor="event-title"
          required
          error={state.fieldErrors?.title}
        >
          <Input
            id="event-title"
            name="title"
            defaultValue={event?.title}
            required
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value, "event"));
            }}
            aria-invalid={Boolean(state.fieldErrors?.title)}
          />
        </Field>

        <Field
          label="Title in Urdu"
          htmlFor="event-title-urdu"
          hint="Optional. Shown in Nastaliq beside the English."
          error={state.fieldErrors?.titleUrdu}
        >
          <Input
            id="event-title-urdu"
            name="titleUrdu"
            lang="ur"
            dir="rtl"
            defaultValue={event?.titleUrdu ?? ""}
          />
        </Field>
      </div>

      <Field
        label="Web address"
        htmlFor="event-slug"
        hint={`The event will live at /events/${slug || "…"}`}
        error={state.fieldErrors?.slug}
      >
        <Input
          id="event-slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          aria-invalid={Boolean(state.fieldErrors?.slug)}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Kind" htmlFor="event-kind" error={state.fieldErrors?.kind}>
          <Select id="event-kind" name="kind" defaultValue={event?.kind ?? "mushaira"}>
            {KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Urdu label"
          htmlFor="event-kind-urdu"
          hint="Optional decorative label on the card, e.g. محفل"
          error={state.fieldErrors?.kindUrdu}
        >
          <Input
            id="event-kind-urdu"
            name="kindUrdu"
            lang="ur"
            dir="rtl"
            defaultValue={event?.kindUrdu ?? ""}
          />
        </Field>
      </div>

      <Field
        label="Category"
        htmlFor="event-category"
        hint="Sets the colour on the events page. Separate from Kind — a mushaira held with another society is Cultural and a collaboration."
        error={state.fieldErrors?.category}
      >
        <Select
          id="event-category"
          name="category"
          defaultValue={event?.category ?? "cultural"}
        >
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </Select>
      </Field>

      <Checkbox
        name="isCollaboration"
        checked={isCollaboration}
        onChange={(e) => setIsCollaboration(e.target.checked)}
        label={
          <>
            <span className="font-medium text-ink">Collaboration</span> — held
            jointly with another society, organisation or institution.
          </>
        }
      />

      {isCollaboration ? (
        <Field
          label="Co-hosts"
          htmlFor="event-collaborators"
          hint="Comma separated, e.g. PakSoc, Majlis. Leave blank if the partner isn't settled — the card just says 'In collaboration'."
          error={state.fieldErrors?.collaborators}
        >
          <Input
            id="event-collaborators"
            name="collaborators"
            defaultValue={event?.collaborators.join(", ") ?? ""}
          />
        </Field>
      ) : null}

      <Field
        label="Summary"
        htmlFor="event-summary"
        required
        hint="One sentence. Used on cards and in search results."
        error={state.fieldErrors?.summary}
      >
        <Textarea
          id="event-summary"
          name="summary"
          rows={2}
          defaultValue={event?.summary}
          required
          aria-invalid={Boolean(state.fieldErrors?.summary)}
        />
      </Field>

      <Field
        label="Full description"
        htmlFor="event-body"
        hint="Optional, Markdown."
        error={state.fieldErrors?.body}
      >
        <Textarea
          id="event-body"
          name="body"
          rows={6}
          defaultValue={event?.body ?? ""}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Starts"
          htmlFor="event-starts"
          required
          hint="UK time."
          error={state.fieldErrors?.startsAt}
        >
          <Input
            id="event-starts"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={event ? toDateTimeLocalValue(event.startsAt) : ""}
            aria-invalid={Boolean(state.fieldErrors?.startsAt)}
          />
        </Field>

        <Field
          label="Ends"
          htmlFor="event-ends"
          hint="Optional."
          error={state.fieldErrors?.endsAt}
        >
          <Input
            id="event-ends"
            name="endsAt"
            type="datetime-local"
            defaultValue={
              event?.endsAt ? toDateTimeLocalValue(event.endsAt) : ""
            }
            aria-invalid={Boolean(state.fieldErrors?.endsAt)}
          />
        </Field>
      </div>

      <Field
        label="Venue"
        htmlFor="event-venue"
        hint="Leave blank if the room isn't booked yet — the site omits it rather than showing a gap."
        error={state.fieldErrors?.venue}
      >
        <Input
          id="event-venue"
          name="venue"
          defaultValue={event?.venue ?? ""}
          aria-invalid={Boolean(state.fieldErrors?.venue)}
        />
      </Field>

      <Checkbox
        name="timeTbc"
        defaultChecked={event ? !event.showTime : false}
        label={
          <>
            <span className="font-medium text-ink">Time not confirmed</span> —
            show the date only. Use this for events recovered from an old term
            card, or when the hour isn&rsquo;t settled.
          </>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Booking"
          htmlFor="event-ticketing"
          hint={
            ticketing === "none"
              ? "People just turn up."
              : "Visitors can book a place from the event page."
          }
          error={state.fieldErrors?.ticketing}
        >
          <Select
            id="event-ticketing"
            name="ticketing"
            value={ticketing}
            onChange={(e) =>
              setTicketing(e.target.value as typeof ticketing)
            }
          >
            <option value="none">No booking needed</option>
            <option value="rsvp">Free RSVP</option>
            {/* "paid" is deliberately absent: there is no payment provider
                wired up, so offering it would list an unpayable event. */}
          </Select>
        </Field>

        <Field
          label="Capacity"
          htmlFor="event-capacity"
          hint="Leave blank for uncapped."
          error={state.fieldErrors?.capacity}
        >
          <Input
            id="event-capacity"
            name="capacity"
            type="number"
            min={1}
            step={1}
            defaultValue={event?.capacity ?? ""}
            disabled={ticketing === "none"}
            aria-invalid={Boolean(state.fieldErrors?.capacity)}
          />
        </Field>
      </div>

      <Field
        label="Poster image"
        htmlFor="event-poster-url"
        hint="Optional URL. Cards are designed to look finished without one, so leave it blank rather than using a weak image."
        error={state.fieldErrors?.posterUrl}
      >
        <Input
          id="event-poster-url"
          name="posterUrl"
          value={posterUrl}
          onChange={(e) => setPosterUrl(e.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.posterUrl)}
        />
      </Field>

      {posterUrl.trim() ? (
        <Field
          label="Poster description"
          htmlFor="event-poster-alt"
          required
          hint="What the poster shows and any text on it. Some posters name the guest or the venue, and this is the only way a screen reader reaches that."
          error={state.fieldErrors?.posterAlt}
        >
          <Input
            id="event-poster-alt"
            name="posterAlt"
            defaultValue={event?.posterAlt ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.posterAlt)}
          />
        </Field>
      ) : null}

      <Checkbox
        name="featured"
        checked={featured}
        onChange={(e) => setFeatured(e.target.checked)}
        label={
          <>
            <span className="font-medium text-ink">Feature</span> — put this in
            the carousel at the top of the events page. If nothing is featured,
            the soonest events appear there automatically.
          </>
        }
      />

      {featured ? (
        <Field
          label="Priority"
          htmlFor="event-priority"
          hint="Orders the carousel when several events are featured — higher shows first. Leave at 0 if you don't mind."
          error={state.fieldErrors?.priority}
        >
          <Input
            id="event-priority"
            name="priority"
            type="number"
            step={1}
            defaultValue={event?.priority ?? 0}
            aria-invalid={Boolean(state.fieldErrors?.priority)}
          />
        </Field>
      ) : null}

      <Checkbox
        name="published"
        defaultChecked={event?.published ?? false}
        label={
          <>
            <span className="font-medium text-ink">Publish</span> — show this on
            the public site. Leave unticked to keep it as a draft.
          </>
        }
      />

      <div className="flex items-center gap-4">
        <SubmitButton pendingLabel="Saving…" className="px-5 py-2.5 text-xs">
          {event ? "Save changes" : "Create event"}
        </SubmitButton>
      </div>
    </form>
  );
}
