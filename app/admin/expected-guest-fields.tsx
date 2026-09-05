"use client";

import { useState } from "react";
import { INVITATION_ADDITIONS, NAME_PREFIXES } from "@/lib/invitation";

export function ExpectedGuestFields({
  guest,
  parties,
}: {
  guest?: { namePrefix: string | null; name: string; addition: string | null; invitedPersons: number; partyId: string };
  parties: { id: string; name: string }[];
}) {
  const [addition, setAddition] = useState(guest?.addition ?? "");
  const [count, setCount] = useState(guest?.invitedPersons ?? 1);
  const hasVariableCount = addition === "family" || addition === "children";
  const fixedCount = !addition ? 1 : hasVariableCount ? Math.max(2, count) : 2;

  return (
    <div className="admin-form-grid">
      <label suppressHydrationWarning>Name prefix
        <select name="namePrefix" defaultValue={guest?.namePrefix ?? ""} suppressHydrationWarning>
          <option value="">None</option>
          {NAME_PREFIXES.map((prefix) => <option key={prefix} value={prefix}>{prefix}</option>)}
        </select>
      </label>
      <label suppressHydrationWarning>Name<input name="name" defaultValue={guest?.name ?? ""} required maxLength={120} suppressHydrationWarning /></label>
      <label suppressHydrationWarning>Addition
        <select name="addition" value={addition} onChange={(event) => setAddition(event.target.value)} suppressHydrationWarning>
          <option value="">None</option>
          {INVITATION_ADDITIONS.map((value) => <option key={value} value={value}>and {value}</option>)}
        </select>
      </label>
      <label suppressHydrationWarning>Number
        <select name="invitedPersons" value={fixedCount} disabled={!hasVariableCount} onChange={(event) => setCount(Number(event.target.value))} suppressHydrationWarning>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value} value={value} disabled={hasVariableCount && value === 1}>{value}</option>)}
        </select>
        {!hasVariableCount && <input type="hidden" name="invitedPersons" value={fixedCount} suppressHydrationWarning />}
      </label>
      <label suppressHydrationWarning>Inviting party
        <select name="partyId" required defaultValue={guest?.partyId ?? ""} suppressHydrationWarning>
          <option value="" disabled>Select a party</option>
          {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
        </select>
      </label>
    </div>
  );
}
