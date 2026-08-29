import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's built-in TypeScript runner requires the file extension.
import { invitationGuestCount, invitationName } from "./invitation.ts";

test("invitation names and guest counts follow addition rules", () => {
  assert.equal(invitationName({ namePrefix: "Mr", name: "John" }), "Mr John");
  assert.equal(invitationName({ namePrefix: "Mrs", name: "Jane", addition: "husband", invitedPersons: 9 }), "Mrs Jane and husband");
  assert.equal(invitationName({ namePrefix: "Prof", name: "Brown", addition: "family", invitedPersons: 3 }), "Prof Brown and family of 3");
  assert.equal(invitationName({ namePrefix: "Mr", name: "Sam", addition: "family", invitedPersons: 1 }), "Mr Sam and family of 2");
  assert.equal(invitationName({ namePrefix: "Ven", name: "Soma", addition: "children", invitedPersons: 4 }), "Ven Soma and 3 children");
  assert.equal(invitationName({ namePrefix: "Mx", name: "Alex", addition: "guest", invitedPersons: 8 }), "Mx Alex and guest");
  assert.equal(invitationGuestCount(null, 10), 1);
  assert.equal(invitationGuestCount("partner", 10), 2);
});
