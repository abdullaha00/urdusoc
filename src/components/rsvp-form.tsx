"use client";

import { useActionState } from "react";
import { rsvpAction, type RsvpState } from "@/app/events/[slug]/actions";
import {
  Field,
  FormMessage,
  Honeypot,
  Input,
  SubmitButton,
  Textarea,
} from "@/components/form";

const initialState: RsvpState = { status: "idle" };

export function RsvpForm({
  slug,
  remaining,
}: {
  slug: string;
  remaining: number | null;
}) {
  const [state, formAction] = useActionState(rsvpAction, initialState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tone="success">{state.message}</FormMessage>
        {state.reference ? (
          <p className="text-sm text-ink-muted">
            Your reference is{" "}
            <span className="font-medium tracking-[0.12em] text-forest">
              {state.reference}
            </span>
            . Bring it to the door.
          </p>
        ) : null}
      </div>
    );
  }

  const maxPlaces = Math.min(4, remaining ?? 4);

  return (
    <form action={formAction} className="relative flex flex-col gap-6">
      <input type="hidden" name="slug" value={slug} />
      <Honeypot />

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Your name"
          htmlFor="rsvp-name"
          required
          error={state.fieldErrors?.name}
        >
          <Input
            id="rsvp-name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
        </Field>

        <Field
          label="Email"
          htmlFor="rsvp-email"
          required
          hint="Only used to send your booking and event changes."
          error={state.fieldErrors?.email}
        >
          <Input
            id="rsvp-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
        </Field>
      </div>

      <Field
        label="Places"
        htmlFor="rsvp-quantity"
        hint={
          remaining !== null
            ? `${remaining} place${remaining === 1 ? "" : "s"} left.`
            : "Bring a friend if you like."
        }
        error={state.fieldErrors?.quantity}
      >
        <Input
          id="rsvp-quantity"
          name="quantity"
          type="number"
          min={1}
          max={maxPlaces}
          defaultValue={1}
          className="sm:max-w-32"
        />
      </Field>

      <Field
        label="Anything we should know?"
        htmlFor="rsvp-notes"
        hint="Access needs, dietary requirements, or a poem you would like to read."
      >
        <Textarea id="rsvp-notes" name="notes" rows={3} />
      </Field>

      <div>
        <SubmitButton pendingLabel="Booking…">Book my place</SubmitButton>
      </div>
    </form>
  );
}
