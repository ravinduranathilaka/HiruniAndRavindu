"use client";

import { useActionState, useEffect, useRef } from "react";
import { createExpectedGuest, type CreateExpectedGuestState } from "./actions";
import { ExpectedGuestFields } from "./expected-guest-fields";

const initialState: CreateExpectedGuestState = { status: "idle" };

export function AddExpectedGuestForm({ parties }: { parties: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createExpectedGuest, initialState);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} aria-busy={pending} suppressHydrationWarning>
      <ExpectedGuestFields key={state.guestId ?? "new"} parties={parties} />
      <button type="submit" disabled={!parties.length || pending}>
        {pending && <span className="admin-button-spinner" aria-hidden="true" />}
        {pending ? "Adding…" : "Add guest"}
      </button>
      {!parties.length && <p className="admin-form-hint">A super admin must add an inviting party first.</p>}
      {state.message && <p className={`admin-form-message ${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    </form>
  );
}
