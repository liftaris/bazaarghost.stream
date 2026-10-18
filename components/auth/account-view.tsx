"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { ConnectedAccounts } from "@/components/auth/connected-accounts";
import { DangerZone } from "@/components/auth/danger-zone";
import { ProviderButtons } from "@/components/auth/provider-buttons";
import { SessionList } from "@/components/auth/session-list";
import { initials } from "@/components/auth/user-avatar";
import { isFresh } from "@/lib/auth-client";

export function AccountView() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "anonymous" || state.status === "disabled")
      router.replace("/login?next=/account");
  }, [state.status, router]);

  if (state.status !== "authenticated") {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const { identity } = state;
  const fresh = isFresh(identity);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Avatar className="size-16">
          {identity.image && <AvatarImage src={identity.image} alt="" />}
          <AvatarFallback className="text-xl">{initials(identity.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold">{identity.name}</h1>
          <p className="text-sm text-muted-foreground">
            Signed in {formatDistanceToNow(new Date(identity.createdAt), { addSuffix: true })} ·
            session ends {format(new Date(identity.expiresAt), "PP")}
          </p>
        </div>
      </header>

      {!fresh && (
        <Alert>
          <ShieldAlert />
          <AlertTitle>Confirm it&apos;s you to make changes</AlertTitle>
          <AlertDescription className="gap-3">
            <p>
              Linking accounts, ending sessions and deleting your account need a sign in from
              the last five minutes.
            </p>
            <div className="w-full max-w-xs pt-2">
              <ProviderButtons callbackURL="/account" verb="Sign in again with" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      <ConnectedAccounts fresh={fresh} />
      <SessionList fresh={fresh} />
      <DangerZone fresh={fresh} />
    </div>
  );
}
