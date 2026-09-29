"use client";

import { useActionState } from "react";
import { saveVerse, type VerseFormState } from "@/app/admin/verses/actions";
import {
  Checkbox,
  Field,
  FormMessage,
  Input,
  SubmitButton,
  Textarea,
} from "@/components/form";
import type { Verse } from "@/lib/db/schema";

const initialState: VerseFormState = { status: "idle" };

export function VerseForm({ verse }: { verse?: Verse }) {
  const [state, formAction] = useActionState(saveVerse, initialState);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {verse ? <input type="hidden" name="id" value={verse.id} /> : null}

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}

      <Field
        label="The couplet, in Urdu"
        htmlFor="verse-urdu"
        required
        hint="One line per line. Usually two."
        error={state.fieldErrors?.urduLines}
      >
        <Textarea
          id="verse-urdu"
          name="urduLines"
          lang="ur"
          dir="rtl"
          rows={3}
          className="urdu text-lg"
          defaultValue={verse?.urduLines.join("\n") ?? ""}
          required
          aria-invalid={Boolean(state.fieldErrors?.urduLines)}
        />
      </Field>

      <Field
        label="Transliteration"
        htmlFor="verse-translit"
        required
        hint="One line per line, matching the Urdu above."
        error={state.fieldErrors?.transliterationLines}
      >
        <Textarea
          id="verse-translit"
          name="transliterationLines"
          rows={3}
          defaultValue={verse?.transliterationLines.join("\n") ?? ""}
          required
          aria-invalid={Boolean(state.fieldErrors?.transliterationLines)}
        />
      </Field>

      <Field
        label="Translation"
        htmlFor="verse-translation"
        required
        hint="Plain English. It does not have to scan."
        error={state.fieldErrors?.translation}
      >
        <Textarea
          id="verse-translation"
          name="translation"
          rows={2}
          defaultValue={verse?.translation ?? ""}
          required
          aria-invalid={Boolean(state.fieldErrors?.translation)}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field
          label="Poet"
          htmlFor="verse-poet"
          required
          error={state.fieldErrors?.poetName}
        >
          <Input
            id="verse-poet"
            name="poetName"
            defaultValue={verse?.poetName ?? ""}
            required
            aria-invalid={Boolean(state.fieldErrors?.poetName)}
          />
        </Field>

        <Field label="Poet in Urdu" htmlFor="verse-poet-urdu">
          <Input
            id="verse-poet-urdu"
            name="poetUrdu"
            lang="ur"
            dir="rtl"
            defaultValue={verse?.poetUrdu ?? ""}
          />
        </Field>

        <Field label="Years" htmlFor="verse-years" hint="e.g. 1797–1869">
          <Input
            id="verse-years"
            name="poetYears"
            defaultValue={verse?.poetYears ?? ""}
          />
        </Field>
      </div>

      <Field
        label="Note"
        htmlFor="verse-note"
        hint="Optional. A line of context for someone meeting the poem for the first time."
        error={state.fieldErrors?.note}
      >
        <Textarea
          id="verse-note"
          name="note"
          rows={2}
          defaultValue={verse?.note ?? ""}
        />
      </Field>

      <Checkbox
        name="featured"
        defaultChecked={verse?.featured ?? false}
        label={
          <>
            <span className="font-medium text-ink">Feature on the homepage</span>{" "}
            — this replaces whichever couplet is there now.
          </>
        }
      />

      <div>
        <SubmitButton pendingLabel="Saving…" className="px-5 py-2.5 text-xs">
          {verse ? "Save changes" : "Add couplet"}
        </SubmitButton>
      </div>
    </form>
  );
}
