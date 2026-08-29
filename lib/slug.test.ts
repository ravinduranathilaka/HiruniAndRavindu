import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's built-in TypeScript runner requires the file extension.
import { slugify } from "./slug.ts";

test("slugify creates safe invitation subdomains", () => {
  assert.equal(slugify(" José & Amélie "), "jose-amelie");
  assert.equal(slugify("Ravindu's Family"), "ravindu-s-family");
});
