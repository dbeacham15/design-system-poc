"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/actions/waitlist";

interface WaitlistFormProps {
  appSlug: string;
}

const initialState: WaitlistState = { status: "idle" };

export function WaitlistForm({ appSlug }: WaitlistFormProps) {
  const [state, formAction, isPending] = useActionState(
    joinWaitlist,
    initialState
  );

  if (state.status === "success") {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 text-teal font-medium">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>{state.message}</span>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <form action={formAction} className="flex flex-col sm:flex-row gap-3">
        <input type="hidden" name="app" value={appSlug} />
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          required
          disabled={isPending}
          className="flex-1 bg-surface-raised border border-border rounded-md px-4 py-2 text-text-primary placeholder:text-text-muted disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-violet text-text-primary rounded-md px-6 py-2 font-display font-semibold hover:bg-violet/80 transition-colors disabled:opacity-50"
        >
          {isPending ? "Joining..." : "Join Waitlist"}
        </button>
      </form>
      {state.status === "error" && (
        <p className="text-destructive text-sm mt-2">{state.message}</p>
      )}
    </div>
  );
}
