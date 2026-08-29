import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's built-in TypeScript runner requires the file extension.
import { createInvitationSlug, slugify } from "./slug.ts";

test("slugify creates safe invitation subdomains", () => {
  assert.equal(slugify(" José & Amélie "), "jose-amelie");
  assert.equal(slugify("Ravindu's Family"), "ravindu-s-family");
  assert.equal(createInvitationSlug("Jane Doe", "a1b2c3d4e5f6"), "jane-doe-a1b2c3d4e5f6");
  assert.equal(createInvitationSlug("A".repeat(80), "a1b2c3d4e5f6").length, 63);
});
