"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { ConfirmAction } from "@/components/auth/confirm-action";
import { authClient, type UserSession } from "@/lib/auth-client";

async function fetchSessions() {
  const { data } = await authClient.$fetch<{ sessions: UserSession[] }>("/sessions");
  return data?.sessions ?? [];
}

export function SessionList({ fresh }: { fresh: boolean }) {
  const { state, post, refresh } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<UserSession[] | null>(null);
  const currentId = state.status === "authenticated" ? state.identity.sessionId : null;

  const load = useCallback(async () => setSessions(await fetchSessions()), []);

  useEffect(() => {
    let cancelled = false;
    void fetchSessions().then((list) => {
      if (!cancelled) setSessions(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function leave(path: string, body?: Record<string, unknown>, done?: string) {
    try {
      await post(path, body);
      if (done) toast.success(done);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  async function revoke(session: UserSession) {
    await leave("/revoke-session", { sessionId: session.id }, "Session ended");
    if (session.id === currentId) {
      await refresh();
      router.push("/");
    } else {
      await load();
    }
  }

  async function signOutEverywhere() {
    await leave("/sign-out-all");
    await refresh();
    router.push("/");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>Browsers where you&apos;re currently signed in.</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions === null ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <ul className="flex flex-col">
            {sessions.map((session, index) => (
              <li key={session.id}>
                {index > 0 && <Separator />}
                <div className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 font-medium">
                      Started {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                      {session.id === currentId && <Badge>This browser</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {format(new Date(session.expiresAt), "PP")}
                    </p>
                  </div>
                  <ConfirmAction
                    trigger={
                      <Button variant="outline" size="sm" disabled={!fresh}>
                        {session.id === currentId ? "Sign out" : "End"}
                      </Button>
                    }
                    title={session.id === currentId ? "Sign out of this browser?" : "End this session?"}
                    description={
                      session.id === currentId
                        ? "You will need to sign in again to like or comment."
                        : "Whoever is using it will be signed out right away."
                    }
                    action={session.id === currentId ? "Sign out" : "End session"}
                    onConfirm={() => revoke(session)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <ConfirmAction
          trigger={
            <Button variant="secondary" size="sm" disabled={!fresh}>
              Sign out everywhere
            </Button>
          }
          title="Sign out everywhere?"
          description="Every browser, including this one, will be signed out."
          action="Sign out everywhere"
          onConfirm={signOutEverywhere}
        />
      </CardFooter>
    </Card>
  );
}
