export const NAME_PREFIXES = ["Mr", "Mrs", "Ms", "Miss", "Mx", "Master", "Dr", "Prof", "Rev", "Ven", "Hon"] as const;
export const INVITATION_ADDITIONS = ["husband", "wife", "partner", "guest", "children", "family"] as const;

export type InvitationAddition = (typeof INVITATION_ADDITIONS)[number];

export function invitationGuestCount(addition?: string | null, requestedCount?: number) {
  if (!addition) return 1;
  if (addition !== "family" && addition !== "children") return 2;
  return Math.min(10, Math.max(2, requestedCount ?? 2));
}

export function rsvpGuestCount(attending: boolean, whoAttending?: string, invitedPersons = 1) {
  if (!attending) return 0;
  return whoAttending === "MYSELF_AND_OTHER_INVITEES" ? invitedPersons : 1;
}

export function invitationName(guest: {
  name: string;
  namePrefix?: string | null;
  addition?: string | null;
  invitedPersons?: number;
}) {
  const count = invitationGuestCount(guest.addition, guest.invitedPersons);
  const addition = guest.addition === "children"
    ? `and ${count - 1} ${count === 2 ? "child" : "children"}`
    : guest.addition && `and ${guest.addition}`;
  const parts = [guest.namePrefix, guest.name, addition].filter(Boolean);
  if (guest.addition === "family") parts.push(`of ${count}`);
  return parts.join(" ");
}
