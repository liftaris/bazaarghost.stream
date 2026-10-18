"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/auth/auth-provider";
import { PROVIDERS, isKnownProvider } from "@/components/auth/provider-icons";
import type { AuthProviderId } from "@/lib/auth-client";

/** One button per configured provider; used for first sign-in and for re-confirming identity. */
export function ProviderButtons({
  callbackURL,
  providers,
  mode = "signIn",
  verb = "Continue with",
}: {
  callbackURL: string;
  providers?: AuthProviderId[];
  mode?: "signIn" | "link";
  verb?: string;
}) {
  const auth = useAuth();
  const [pending, setPending] = useState<AuthProviderId | null>(null);
  const list = (providers ?? auth.providers).filter(isKnownProvider);

  async function go(provider: AuthProviderId) {
    setPending(provider);
    try {
      await (mode === "link" ? auth.linkProvider : auth.signIn)(provider, callbackURL);
    } catch (error) {
      setPending(null);
      toast.error(error instanceof Error ? error.message : "Could not start sign in.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map((id) => {
        const { label, Icon } = PROVIDERS[id];
        return (
          <Button
            key={id}
            variant="outline"
            size="lg"
            disabled={pending !== null}
            onClick={() => go(id)}
          >
            {pending === id ? <Spinner /> : <Icon />}
            {verb} {label}
          </Button>
        );
      })}
    </div>
  );
}
