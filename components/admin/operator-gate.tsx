"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpsResource } from "./hooks/use-ops-resource";
import { IdChip } from "./id-chip";
import { signInHref } from "./lib/sign-in";
import { ErrorState } from "./load-states";
import { ConsoleFrame } from "./console-frame";
import { OperatorAccessContext, useOperatorAccess } from "./operator-access";

function FrameSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the operator console" className="flex flex-1 flex-col md:flex-row">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border bg-card p-3 md:w-60 md:border-r md:border-b-0">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-2/3" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

function GateMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 py-16">
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <ShieldX aria-hidden className="size-5 text-muted-foreground" />
        {title}
      </h1>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export function OperatorSession({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const signedOut = state.status === "anonymous";

  useEffect(() => {
    if (!signedOut) return;
    router.replace(signInHref(pathname, search));
  }, [signedOut, pathname, search, router]);

  if (state.status === "disabled")
    return (
      <GateMessage title="Sign-in is turned off">
        <p>This deployment runs without accounts, so the operator console cannot be used here.</p>
      </GateMessage>
    );

  if (state.status !== "authenticated") return <FrameSkeleton />;
  return (
    <OperatorAccess key={JSON.stringify([state.identity.userId, state.identity.sessionId])}>
      {children}
    </OperatorAccess>
  );
}

function OperatorAccess({ children }: { children: ReactNode }) {
  const me = useOpsResource("/me", {});
  const { refresh } = useAuth();
  const expired = me.error?.status === 401;
  useEffect(() => {
    if (expired) void refresh();
  }, [expired, refresh]);

  return (
    <OperatorAccessContext.Provider value={me}>
      <ConsoleFrame>{me.error ? <OperatorGate /> : children}</ConsoleFrame>
    </OperatorAccessContext.Provider>
  );
}

export function OperatorGate({ children }: { children?: ReactNode }) {
  const { state } = useAuth();
  const me = useOperatorAccess();
  if (me.error?.status === 403 && state.status === "authenticated")
    return (
      <GateMessage title="This account is not an operator">
        <p>
          You are signed in as {state.identity.name}, but this account has no operator access. An admin can grant it
          with your user id.
        </p>
        <IdChip value={state.identity.userId} label="Copy user id" className="self-start" />
      </GateMessage>
    );

  if (me.error)
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16">
        <ErrorState title="Could not check operator access" error={me.error} onRetry={me.reload} />
      </div>
    );

  if (!me.data || me.loading) return <FrameSkeleton />;
  return children;
}
