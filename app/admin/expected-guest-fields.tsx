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
      <label>Name prefix
        <select name="namePrefix" defaultValue={guest?.namePrefix ?? ""}>
          <option value="">None</option>
          {NAME_PREFIXES.map((prefix) => <option key={prefix} value={prefix}>{prefix}</option>)}
        </select>
      </label>
      <label>Name<input name="name" defaultValue={guest?.name ?? ""} required maxLength={120} /></label>
      <label>Addition
        <select name="addition" value={addition} onChange={(event) => setAddition(event.target.value)}>
          <option value="">None</option>
          {INVITATION_ADDITIONS.map((value) => <option key={value} value={value}>and {value}</option>)}
        </select>
      </label>
      <label>Number
        <select name="invitedPersons" value={fixedCount} disabled={!hasVariableCount} onChange={(event) => setCount(Number(event.target.value))}>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value} value={value} disabled={hasVariableCount && value === 1}>{value}</option>)}
        </select>
        {!hasVariableCount && <input type="hidden" name="invitedPersons" value={fixedCount} />}
      </label>
      <label>Inviting party
        <select name="partyId" required defaultValue={guest?.partyId ?? ""}>
          <option value="" disabled>Select a party</option>
          {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
        </select>
      </label>
    </div>
  );
}
