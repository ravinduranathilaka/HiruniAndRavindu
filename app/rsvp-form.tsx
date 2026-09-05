"use client";

import { useActionState, useState } from "react";
import { submitRsvp, type RsvpState } from "./actions";
import { Icon } from "./icons";

const initialState: RsvpState = { status: "idle" };

export function RsvpForm({ defaultName, invitationSlug }: { defaultName?: string; invitationSlug?: string }) {
  const [state, formAction, pending] = useActionState(submitRsvp, initialState);
  const [attending, setAttending] = useState<"yes" | "no" | null>(null);
  const error = (field: string) => state.errors?.[field]?.[0];

  if (state.status === "success") {
    return <div className="form-success" role="status"><Icon name="heart" /><p>{state.message}</p></div>;
  }

  return (
    <form action={formAction} aria-label="Wedding RSVP" suppressHydrationWarning>
      {invitationSlug && <input type="hidden" name="invitationSlug" value={invitationSlug} suppressHydrationWarning />}
      <span className="form-note">Your Response</span>

      <label htmlFor="fullName">Full Name *</label>
      <input id="fullName" name="fullName" type="text" autoComplete="name" maxLength={120} defaultValue={defaultName} required aria-invalid={Boolean(error("fullName"))} suppressHydrationWarning />
      {error("fullName") && <p className="field-error">{error("fullName")}</p>}

      <label htmlFor="phoneNumber">Phone Number *</label>
      <input id="phoneNumber" name="phoneNumber" type="tel" inputMode="tel" autoComplete="tel" defaultValue="+94" maxLength={18} required aria-invalid={Boolean(error("phoneNumber"))} suppressHydrationWarning />
      {error("phoneNumber") && <p className="field-error">{error("phoneNumber")}</p>}

      <label htmlFor="email">Email <span>(optional)</span></label>
      <input id="email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="your@email.com" aria-invalid={Boolean(error("email"))} suppressHydrationWarning />
      {error("email") && <p className="field-error">{error("email")}</p>}

      <fieldset>
        <legend>Will You Be Attending? *</legend>
        <div className="choice-row">
          <label className="choice-option" suppressHydrationWarning><input type="radio" name="attending" value="yes" required onChange={() => setAttending("yes")} suppressHydrationWarning /><span>Joyfully Accept</span></label>
          <label className="choice-option" suppressHydrationWarning><input type="radio" name="attending" value="no" required onChange={() => setAttending("no")} suppressHydrationWarning /><span>Regretfully Decline</span></label>
        </div>
        {error("attending") && <p className="field-error">{error("attending")}</p>}
      </fieldset>

      {attending === "yes" && (
        <fieldset>
          <legend>Who Will Be Attending? *</legend>
          <div className="choice-row who-attending-options">
            <label className="choice-option" suppressHydrationWarning><input type="radio" name="whoAttending" value="ONLY_MYSELF" required suppressHydrationWarning /><span>Only myself</span></label>
            <label className="choice-option" suppressHydrationWarning><input type="radio" name="whoAttending" value="MYSELF_AND_OTHER_INVITEES" required suppressHydrationWarning /><span>Myself and the other invitees</span></label>
            <label className="choice-option" suppressHydrationWarning><input type="radio" name="whoAttending" value="COMPLICATED" required suppressHydrationWarning /><span>It&apos;s complicated (please give us a call)</span></label>
          </div>
          {error("whoAttending") && <p className="field-error">{error("whoAttending")}</p>}
        </fieldset>
      )}

      <label htmlFor="message">Message for the Couple</label>
      <textarea id="message" name="message" placeholder="Share your wishes..." rows={4} maxLength={1000} aria-invalid={Boolean(error("message"))} suppressHydrationWarning />
      {error("message") && <p className="field-error">{error("message")}</p>}

      {state.message && <p className="form-status form-error" role="alert">{state.message}</p>}
      <button className="send-button" type="submit" disabled={pending}><Icon name="mail" />{pending ? "Sending..." : "Send RSVP"}</button>
    </form>
  );
}
