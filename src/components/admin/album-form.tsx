"use client";

import { useActionState, useState } from "react";
import { saveAlbum, type AlbumFormState } from "@/app/admin/gallery/actions";
import {
  Checkbox,
  Field,
  FormMessage,
  Input,
  Select,
  SubmitButton,
  Textarea,
} from "@/components/form";
import type { Album } from "@/lib/db/schema";
import { MOTIFS } from "@/lib/motifs";
import { slugify } from "@/lib/slug";

const initialState: AlbumFormState = { status: "idle" };

export function AlbumForm({
  album,
  events,
}: {
  album?: Album;
  events: { id: string; title: string }[];
}) {
  const [state, formAction] = useActionState(saveAlbum, initialState);
  const [slug, setSlug] = useState(album?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(album));

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {album ? <input type="hidden" name="id" value={album.id} /> : null}

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}

      <Field
        label="Title"
        htmlFor="album-title"
        required
        error={state.fieldErrors?.title}
      >
        <Input
          id="album-title"
          name="title"
          defaultValue={album?.title ?? ""}
          required
          onChange={(e) => {
            if (!slugTouched) setSlug(slugify(e.target.value, "album"));
          }}
          aria-invalid={Boolean(state.fieldErrors?.title)}
        />
      </Field>

      <Field
        label="Web address"
        htmlFor="album-slug"
        hint={`The album will live at /gallery/${slug || "…"}`}
        error={state.fieldErrors?.slug}
      >
        <Input
          id="album-slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          aria-invalid={Boolean(state.fieldErrors?.slug)}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="album-description"
        hint="Optional. A sentence about the evening."
        error={state.fieldErrors?.description}
      >
        <Textarea
          id="album-description"
          name="description"
          rows={3}
          defaultValue={album?.description ?? ""}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Taken on"
          htmlFor="album-taken"
          hint="Optional. Used to group the gallery by month."
          error={state.fieldErrors?.takenOn}
        >
          <Input
            id="album-taken"
            name="takenOn"
            type="date"
            defaultValue={
              album?.takenOn ? album.takenOn.toISOString().slice(0, 10) : ""
            }
            aria-invalid={Boolean(state.fieldErrors?.takenOn)}
          />
        </Field>

        <Field
          label="From event"
          htmlFor="album-event"
          hint="Optional. Links the album back to the event page."
        >
          <Select
            id="album-event"
            name="eventId"
            defaultValue={album?.eventId ?? ""}
          >
            <option value="">Not linked</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Placeholder motif"
        htmlFor="album-motif"
        hint="Drawn in place of photographs until the album has some."
        error={state.fieldErrors?.motif}
      >
        <Select
          id="album-motif"
          name="motif"
          defaultValue={album?.motif ?? "calligraphy"}
        >
          {MOTIFS.map((motif) => (
            <option key={motif.value} value={motif.value}>
              {motif.label}
            </option>
          ))}
        </Select>
      </Field>

      <Checkbox
        name="published"
        defaultChecked={album?.published ?? false}
        label={
          <>
            <span className="font-medium text-ink">Publish</span> — show this
            album in the public gallery.
          </>
        }
      />

      <div>
        <SubmitButton pendingLabel="Saving…" className="px-5 py-2.5 text-xs">
          {album ? "Save changes" : "Create album"}
        </SubmitButton>
      </div>
    </form>
  );
}
