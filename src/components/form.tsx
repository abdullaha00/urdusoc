"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";
import { buttonBase, buttonVariants } from "@/components/ui";

/* -------------------------------------------------------------------------- */
/* Field wrappers                                                              */
/* -------------------------------------------------------------------------- */

const controlClasses =
  "w-full rounded-sm border border-rule bg-paper px-4 py-3 text-sm text-ink transition-colors duration-200 placeholder:text-ink-muted/60 hover:border-gold/60 focus:border-gold focus:outline-none disabled:opacity-60 aria-[invalid=true]:border-wine";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[0.68rem] font-medium tracking-[0.22em] text-ink-muted uppercase"
      >
        {label}
        {required ? (
          <span aria-hidden className="ml-1 text-wine">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-wine">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={`${controlClasses} ${className}`} />;
}

export function Textarea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea {...props} className={`${controlClasses} ${className}`} rows={props.rows ?? 4} />
  );
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select {...props} className={`${controlClasses} ${className}`} />;
}

export function Checkbox({
  label,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
      <input
        type="checkbox"
        {...props}
        className={`mt-0.5 size-4 shrink-0 rounded-xs border-rule text-forest accent-[var(--color-forest)] ${className}`}
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * Honeypot. Bots fill hidden fields in; humans never see it. Server actions
 * reject any submission where this arrives non-empty.
 */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="company">Company</label>
      <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Submit                                                                      */
/* -------------------------------------------------------------------------- */

/** Submit button that disables itself and reports progress while pending. */
export function SubmitButton({
  children,
  pendingLabel = "Sending…",
  variant = "primary",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: keyof typeof buttonVariants;
  className?: string;
  /** Held closed until some precondition is met — see `DangerConfirm`. */
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${buttonBase} ${buttonVariants[variant]} ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Result banner shown above a form after a server action returns. */
export function FormMessage({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: ReactNode;
}) {
  const toneClasses =
    tone === "success"
      ? "border-forest/25 bg-forest/5 text-forest"
      : "border-wine/30 bg-wine/5 text-wine";

  return (
    <p
      role="status"
      className={`rounded-sm border px-4 py-3 text-sm leading-relaxed ${toneClasses}`}
    >
      {children}
    </p>
  );
}
