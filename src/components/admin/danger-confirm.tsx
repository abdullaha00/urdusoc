"use client";

import { useId, useState } from "react";
import { SubmitButton } from "@/components/form";

/**
 * Destructive submit that will not fire until the exact phrase is typed.
 *
 * Used where a mis-click cannot be undone — deleting an event takes its
 * registrations with it (`onDelete: "cascade"` in the schema), and erasing a
 * member is a GDPR action we cannot reverse. A native `confirm()` dialog is too
 * easy to dismiss on reflex; typing the name forces a look at what is selected.
 */
export function DangerConfirm({
  phrase,
  openLabel = "Delete…",
  confirmLabel = "Delete permanently",
  pendingLabel = "Deleting…",
  description,
}: {
  /** What the user must type — normally the record's title or email. */
  phrase: string;
  openLabel?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const inputId = useId();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-wine underline decoration-wine/30 underline-offset-4 transition-colors hover:decoration-wine"
      >
        {openLabel}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-wine/30 bg-wine/5 p-4">
      <label htmlFor={inputId} className="text-xs leading-relaxed text-wine">
        {description ? `${description} ` : null}
        Type <span className="font-medium">{phrase}</span> to confirm.
      </label>

      <input
        id={inputId}
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        autoComplete="off"
        className="w-full rounded-sm border border-wine/30 bg-paper px-3 py-2 text-sm focus:border-wine focus:outline-none"
      />

      <div className="flex items-center gap-3">
        {/* Genuinely disabled, not just dimmed: a disabled default button also
            blocks implicit submission when Enter is pressed in the input. */}
        <SubmitButton
          variant="danger"
          pendingLabel={pendingLabel}
          className="px-4 py-2 text-xs"
          disabled={typed !== phrase}
        >
          {confirmLabel}
        </SubmitButton>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="text-xs text-ink-muted underline underline-offset-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
