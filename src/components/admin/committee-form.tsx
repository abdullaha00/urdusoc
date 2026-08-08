"use client";

import { useActionState } from "react";
import {
  saveCommitteeMember,
  type CommitteeFormState,
} from "@/app/admin/committee/actions";
import {
  Checkbox,
  Field,
  FormMessage,
  Input,
  SubmitButton,
  Textarea,
} from "@/components/form";
import type { CommitteeMember } from "@/lib/db/schema";

const initialState: CommitteeFormState = { status: "idle" };

export function CommitteeForm({
  person,
  defaultYear,
}: {
  person?: CommitteeMember;
  /** Pre-fills the year when adding to an existing roster. */
  defaultYear?: string;
}) {
  const [state, formAction] = useActionState(saveCommitteeMember, initialState);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {person ? <input type="hidden" name="id" value={person.id} /> : null}

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Role"
          htmlFor="member-role"
          required
          hint="e.g. President, Treasurer."
          error={state.fieldErrors?.role}
        >
          <Input
            id="member-role"
            name="role"
            defaultValue={person?.role ?? ""}
            required
            aria-invalid={Boolean(state.fieldErrors?.role)}
          />
        </Field>

        <Field
          label="Name"
          htmlFor="member-name"
          required
          hint="“To be announced” is fine until the role is filled."
          error={state.fieldErrors?.name}
        >
          <Input
            id="member-name"
            name="name"
            defaultValue={person?.name ?? "To be announced"}
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name in Urdu" htmlFor="member-name-urdu">
          <Input
            id="member-name-urdu"
            name="nameUrdu"
            lang="ur"
            dir="rtl"
            defaultValue={person?.nameUrdu ?? ""}
          />
        </Field>

        <Field
          label="Email"
          htmlFor="member-email"
          hint="Optional, shown publicly on /committee."
          error={state.fieldErrors?.email}
        >
          <Input
            id="member-email"
            name="email"
            type="email"
            defaultValue={person?.email ?? ""}
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
        </Field>
      </div>

      <Field
        label="Bio"
        htmlFor="member-bio"
        hint="Optional. A couple of sentences."
        error={state.fieldErrors?.bio}
      >
        <Textarea
          id="member-bio"
          name="bio"
          rows={3}
          defaultValue={person?.bio ?? ""}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Academic year"
          htmlFor="member-year"
          required
          hint="e.g. 2026–27"
          error={state.fieldErrors?.academicYear}
        >
          <Input
            id="member-year"
            name="academicYear"
            defaultValue={person?.academicYear ?? defaultYear ?? ""}
            required
            aria-invalid={Boolean(state.fieldErrors?.academicYear)}
          />
        </Field>

        <Field
          label="Order"
          htmlFor="member-order"
          hint="Lower numbers come first. You can also reorder from the list."
          error={state.fieldErrors?.orderIndex}
        >
          <Input
            id="member-order"
            name="orderIndex"
            type="number"
            step={1}
            defaultValue={person?.orderIndex ?? 0}
          />
        </Field>
      </div>

      <Checkbox
        name="isCurrent"
        defaultChecked={person?.isCurrent ?? true}
        label={
          <>
            <span className="font-medium text-ink">Current committee</span> —
            shown on /committee. Untick for past years.
          </>
        }
      />

      <div>
        <SubmitButton pendingLabel="Saving…" className="px-5 py-2.5 text-xs">
          {person ? "Save changes" : "Add to committee"}
        </SubmitButton>
      </div>
    </form>
  );
}
