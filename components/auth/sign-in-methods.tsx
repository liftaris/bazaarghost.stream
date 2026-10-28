"use client";

import { ConnectedAccounts } from "@/components/auth/connected-accounts";
import { PasskeysCard } from "@/components/auth/passkeys-card";
import { useCredentials } from "@/hooks/use-credentials";

/** Connected accounts and passkeys, loaded together so neither list can remove the last method. */
export function SignInMethods({ fresh }: { fresh: boolean }) {
  const { credentials, reload } = useCredentials();
  const removable = credentials?.removable ?? false;
  return (
    <>
      <ConnectedAccounts
        fresh={fresh}
        accounts={credentials?.accounts ?? null}
        removable={removable}
        onChange={reload}
      />
      <PasskeysCard
        fresh={fresh}
        passkeys={credentials?.passkeys ?? null}
        removable={removable}
        onChange={reload}
      />
    </>
  );
}
