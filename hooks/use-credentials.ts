"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient, type LinkedAccount } from "@/lib/auth-client";
import type { UserPasskey } from "@/lib/passkeys";

/** Every way the signed-in user can sign in. Removing one is allowed only while another remains. */
export interface Credentials {
  accounts: LinkedAccount[];
  passkeys: UserPasskey[];
  /** False when exactly one sign-in method is left. */
  removable: boolean;
}

async function fetchCredentials(): Promise<Credentials> {
  const [accounts, passkeys] = await Promise.all([
    authClient.$fetch<{ accounts: LinkedAccount[] }>("/accounts"),
    authClient.$fetch<{ passkeys: UserPasskey[] }>("/passkeys"),
  ]);
  const list = { accounts: accounts.data?.accounts ?? [], passkeys: passkeys.data?.passkeys ?? [] };
  return { ...list, removable: list.accounts.length + list.passkeys.length > 1 };
}

/**
 * Loads connected accounts and passkeys together, so both lists share the last-method rule.
 * @returns The credentials (null while loading) and `reload` to refetch after a change.
 */
export function useCredentials() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const reload = useCallback(async () => setCredentials(await fetchCredentials()), []);

  useEffect(() => {
    let cancelled = false;
    void fetchCredentials().then((next) => {
      if (!cancelled) setCredentials(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { credentials, reload };
}
