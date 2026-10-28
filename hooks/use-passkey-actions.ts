"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { authClient } from "@/lib/auth-client";
import {
  passkeyErrorMessage,
  passkeysSupported,
  UNSUPPORTED,
  type PasskeyAction,
  type PasskeyFailure,
} from "@/lib/passkeys";

/** Passkey ceremonies. Each resolves to null on success or a message that names the recovery. */
export interface PasskeyActions {
  signIn: () => Promise<string | null>;
  /** Creates an account named `displayName`; the user row exists only after the prompt succeeds. */
  signUp: (displayName: string) => Promise<string | null>;
  /** Adds a passkey to the signed-in user. Needs a sign in from the last five minutes. */
  add: () => Promise<string | null>;
}

/**
 * Runs passkey ceremonies through the Better Auth client and refreshes the session after
 * sign-in and sign-up.
 * @returns {PasskeyActions}
 */
export function usePasskeyActions(): PasskeyActions {
  const { state, refresh } = useAuth();
  const csrf = state.status === "authenticated" ? state.identity.csrfToken : "";

  const run = useCallback(
    async (action: PasskeyAction, ceremony: () => Promise<{ error: PasskeyFailure | null }>) => {
      if (!passkeysSupported()) return UNSUPPORTED;
      const { error } = await ceremony();
      if (error) return passkeyErrorMessage(error, action);
      if (action !== "add") await refresh();
      return null;
    },
    [refresh],
  );

  return useMemo(
    () => ({
      signIn: () => run("sign-in", () => authClient.signIn.passkey()),
      signUp: (displayName: string) =>
        run("sign-up", () =>
          authClient.passkey.addPasskey({ context: displayName.normalize("NFC").trim(), createSession: true }),
        ),
      add: () =>
        run("add", () => authClient.passkey.addPasskey({ fetchOptions: { headers: { "X-CSRF-Token": csrf } } })),
    }),
    [run, csrf],
  );
}
