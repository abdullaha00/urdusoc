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
  { value: "collaboration", label: "Collaboration" },
] as const;

export function EventForm({ event }: { event?: Event }) {
  const [state, formAction] = useActionState(saveEvent, initialState);

  // The slug follows the title until someone edits it by hand; after that it is
  // left alone, so an established URL is never changed by a title tweak.
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(event));
  const [ticketing, setTicketing] = useState(event?.ticketing ?? "none");

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
        required
        error={state.fieldErrors?.venue}
      >
        <Input
          id="event-venue"
          name="venue"
          defaultValue={event?.venue}
          required
          aria-invalid={Boolean(state.fieldErrors?.venue)}
        />
      </Field>

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
