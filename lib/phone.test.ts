import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's built-in TypeScript runner requires the file extension.
import { normalizeSriLankanPhone, SRI_LANKAN_PHONE_NUMBER } from "./phone.ts";

test("Sri Lankan phone numbers normalize to one canonical format", () => {
  for (const value of ["077 123 4567", "+94 77 123 4567", "+94 077 123 4567", "0094 77 123 4567"]) {
    assert.equal(normalizeSriLankanPhone(value), "+94771234567");
  }
  assert.match(normalizeSriLankanPhone("+94 077 123 4567"), SRI_LANKAN_PHONE_NUMBER);
  assert.doesNotMatch(normalizeSriLankanPhone("077 123 456"), SRI_LANKAN_PHONE_NUMBER);
});
