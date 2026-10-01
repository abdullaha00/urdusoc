"use server";

import { z } from "zod";
import { subscribeEmail } from "@/lib/subscribe";

export type SubscribeState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const subscribeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("That does not look like an email address."));

export async function subscribeAction(
  _previous: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  if (formData.get("company")) {
    return { status: "success", message: "Please check your email to confirm." };
  }

  const parsed = subscribeSchema.safeParse(formData.get("email"));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check your address.",
    };
  }

  try {
    await subscribeEmail(parsed.data, String(formData.get("source") ?? "footer"));
  } catch (error) {
    console.error("Subscribe failed", error);
    return {
      status: "error",
      message: "We could not sign you up just now. Please try again.",
    };
  }

  // Deliberately the same reply whether or not the address was already on the
  // list, so the form cannot be used to discover who is subscribed.
  return {
    status: "success",
    message: "Almost there - check your email for a confirmation link.",
  };
}
