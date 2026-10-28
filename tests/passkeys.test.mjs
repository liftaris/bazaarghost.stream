import assert from "node:assert/strict";
import test from "node:test";
import { sourceModules } from "./helpers/source-harness.mjs";

const load = sourceModules();
const { displayNameProblem, passkeyErrorMessage, passkeyLabel } = load("@/lib/passkeys");

test("display names follow the backend's 1-40 visible character rule", () => {
  for (const ok of ["Kaio", "  Kaio  ", "é".repeat(40), "👩‍💻 dev"]) assert.equal(displayNameProblem(ok), null, ok);
  assert.equal(displayNameProblem("   "), "Enter a display name.");
  assert.equal(displayNameProblem("x".repeat(41)), "Use 40 characters or fewer.");
  assert.equal(displayNameProblem("a\nb"), "Remove line breaks and hidden characters.");
  assert.equal(displayNameProblem("a\u200bb"), "Remove line breaks and hidden characters.");
});

test("ceremony failures name the problem and the recovery", () => {
  assert.match(passkeyErrorMessage({ code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY" }, "sign-in"), /prompt closed/);
  assert.match(passkeyErrorMessage({ code: "AUTH_CANCELLED", status: 400 }, "sign-in"), /prompt closed/);
  assert.match(passkeyErrorMessage({ code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED" }, "add"), /already has a passkey/);
  assert.match(passkeyErrorMessage({ status: 401 }, "sign-in"), /Create an account with a passkey/);
  assert.match(passkeyErrorMessage({ status: 401 }, "add"), /Sign in again/);
  assert.match(passkeyErrorMessage({ status: 429 }, "sign-up"), /Wait a minute/);
  const invalid = "Display name must be one line";
  assert.equal(passkeyErrorMessage({ status: 400, error: invalid }, "sign-up"), invalid);
  assert.equal(passkeyErrorMessage({ status: 500, error: "Authentication failed" }, "sign-up"), "The passkey wasn't saved. Try again.");
});

test("passkeys show the password manager name, else a generic label", () => {
  assert.equal(passkeyLabel({ name: "Google Password Manager" }), "Google Password Manager");
  assert.equal(passkeyLabel({ name: null }), "Passkey");
});
