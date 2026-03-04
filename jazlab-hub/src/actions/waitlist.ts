"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function joinWaitlist(
  prevState: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const email = formData.get("email") as string;
  const app = formData.get("app") as string;

  if (!email || !email.includes("@")) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
    };
  }

  try {
    await resend.emails.send({
      from: "JazLab Waitlist <onboarding@resend.dev>",
      to: [process.env.WAITLIST_RECIPIENT_EMAIL ?? "daniel@jazlab.llc"],
      subject: `New waitlist signup: ${app}`,
      text: `${email} joined the ${app} waitlist.`,
    });

    return {
      status: "success",
      message: "You're on the list! We'll be in touch.",
    };
  } catch {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
}
