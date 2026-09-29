"use client";

import { useActionState } from "react";
import { joinAction, type JoinState } from "@/app/join/actions";
import {
  Checkbox,
  Field,
  FormMessage,
  Honeypot,
  Input,
  Select,
  SubmitButton,
} from "@/components/form";
import { membershipTiers } from "@/lib/content";

const initialState: JoinState = { status: "idle" };

export function JoinForm({
  /**
   * Whether the site can send email. When it cannot, the mailing-list opt-in is
   * hidden rather than shown-and-ignored: double opt-in needs a confirmation
   * link, so ticking it could not do anything.
   */
  emailEnabled = true,
}: {
  emailEnabled?: boolean;
}) {
  const [state, formAction] = useActionState(joinAction, initialState);

  if (state.status === "success") {
    return <FormMessage tone="success">{state.message}</FormMessage>;
  }

  return (
    <form action={formAction} className="relative flex flex-col gap-6">
      <Honeypot />

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Your name"
          htmlFor="join-name"
          required
          error={state.fieldErrors?.name}
        >
          <Input
            id="join-name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
        </Field>

        <Field
          label="Email"
          htmlFor="join-email"
          required
          error={state.fieldErrors?.email}
        >
          <Input
            id="join-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="You are"
          htmlFor="join-type"
          error={state.fieldErrors?.type}
        >
          <Select id="join-type" name="type" defaultValue="student">
            {membershipTiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="CRSid"
          htmlFor="join-crsid"
          hint="Optional — helps us check SU membership."
        >
          <Input id="join-crsid" name="crsid" autoComplete="off" />
        </Field>
      </div>

      <div className="flex flex-col gap-4 border-t border-rule pt-6">
        {emailEnabled ? (
          <Checkbox
            name="subscribe"
            defaultChecked
            label="Email me about upcoming events (a handful of times a term, never more)."
          />
        ) : null}
        <Checkbox
          name="consent"
          required
          label={
            <>
              I&rsquo;m happy for UrduSoc to hold my name and email to run the
              society. You can ask us to delete them at any time — see our{" "}
              <a
                href="/privacy"
                className="underline decoration-gold/50 underline-offset-4"
              >
                privacy notice
              </a>
              .
            </>
          }
        />
        {state.fieldErrors?.consent ? (
          <p role="alert" className="text-xs font-medium text-wine">
            {state.fieldErrors.consent}
          </p>
        ) : null}
      </div>

      <div>
        <SubmitButton pendingLabel="Signing you up…">Join UrduSoc</SubmitButton>
      </div>
    </form>
  );
}
