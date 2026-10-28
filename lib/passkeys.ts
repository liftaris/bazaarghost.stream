/** A passkey as the backend's `/passkeys` listing returns it; never includes key material. */
export interface UserPasskey {
  id: string;
  /** The password manager's name, resolved by the backend from the authenticator's AAGUID. */
  name: string | null;
  createdAt: string;
}

/** Which passkey ceremony failed, so the error can name the right recovery. */
export type PasskeyAction = "sign-in" | "sign-up" | "add";

/** The error shape the Better Auth client returns from passkey actions. */
export interface PasskeyFailure {
  code?: string;
  status?: number;
  message?: string;
  error?: unknown;
}

/** Same limit and normalization the backend applies to the sign-up `context`. */
export const DISPLAY_NAME_MAX = 40;

/** Returns why a display name would be rejected, or null when the backend will accept it. */
export function displayNameProblem(value: string): string | null {
  const name = value.normalize("NFC").trim();
  const visible = name.replace(/\u200d/g, "");
  if (!/[^\p{White_Space}\p{M}]/u.test(visible)) return "Enter a display name.";
  if ([...name].length > DISPLAY_NAME_MAX) return `Use ${DISPLAY_NAME_MAX} characters or fewer.`;
  if (/[\p{Cc}\p{Cs}\p{Cf}]/u.test(visible)) return "Remove line breaks and hidden characters.";
  return null;
}

/** False when this browser has no WebAuthn, so no passkey prompt can open. */
export function passkeysSupported() {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential === "function";
}

/** Browser support message, shared by every passkey entry point. */
export const UNSUPPORTED =
  "This browser can't use passkeys. Update it, try another browser, or sign in with Discord or Twitch.";

const CANCELLED = new Set(["ERROR_CEREMONY_ABORTED", "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", "AUTH_CANCELLED", "REGISTRATION_CANCELLED"]);

/** Turns a failed passkey ceremony into a sentence that names the problem and the way out. */
export function passkeyErrorMessage(failure: PasskeyFailure, action: PasskeyAction): string {
  if (failure.code && CANCELLED.has(failure.code))
    return "The passkey prompt closed before it finished. Try again when you're ready.";
  if (failure.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED")
    return "This device already has a passkey for your account.";
  if (failure.status === 429) return "Too many passkey attempts. Wait a minute, then try again.";
  if (failure.status === 400 && typeof failure.error === "string" && failure.error.startsWith("Display name"))
    return failure.error;
  if (action === "add" && (failure.status === 401 || failure.status === 403))
    return "Sign in again, then add the passkey within five minutes.";
  if (action === "sign-in" && failure.status === 401)
    return "That passkey isn't registered here. Create an account with a passkey instead.";
  return action === "sign-in" ? "Passkey sign in failed. Try again." : "The passkey wasn't saved. Try again.";
}

/** The label a person recognizes: the password manager when known, else "Passkey". */
export function passkeyLabel(passkey: Pick<UserPasskey, "name">) {
  return passkey.name || "Passkey";
}
