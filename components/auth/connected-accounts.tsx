"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { ConfirmAction } from "@/components/auth/confirm-action";
import { ProviderButtons } from "@/components/auth/provider-buttons";
import { PROVIDERS, isKnownProvider } from "@/components/auth/provider-icons";
import { authClient, type AuthProviderId, type LinkedAccount } from "@/lib/auth-client";

export function ConnectedAccounts({ fresh }: { fresh: boolean }) {
  const { providers, post, ensureProviders } = useAuth();
  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await authClient.$fetch<{ accounts: LinkedAccount[] }>("/accounts");
    setAccounts(data?.accounts ?? []);
  }, []);

  useEffect(() => {
    void ensureProviders();
  }, [ensureProviders]);

  useEffect(() => {
    void load();
  }, [load]);

  async function unlink(account: LinkedAccount) {
    try {
      await post("/unlink-account", { accountId: account.id });
      toast.success(`${PROVIDERS[account.providerId as AuthProviderId]?.label ?? "Account"} disconnected`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disconnect.");
    }
  }

  const linked = new Set(accounts?.map((a) => a.providerId));
  const available = providers.filter((p) => !linked.has(p));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected accounts</CardTitle>
        <CardDescription>
          Any connected account signs you in to this profile. Keep at least one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {accounts === null ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : (
          <ul className="flex flex-col">
            {accounts.map((account, index) => {
              const meta = isKnownProvider(account.providerId) ? PROVIDERS[account.providerId] : null;
              return (
                <li key={account.id}>
                  {index > 0 && <Separator />}
                  <div className="flex items-center gap-3 py-3">
                    {meta && <meta.Icon className="size-5 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{meta?.label ?? account.providerId}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected {format(new Date(account.createdAt), "PP")}
                      </p>
                    </div>
                    {accounts.length > 1 ? (
                      <ConfirmAction
                        trigger={
                          <Button variant="outline" size="sm" disabled={!fresh}>
                            Disconnect
                          </Button>
                        }
                        title={`Disconnect ${meta?.label ?? "this account"}?`}
                        description="You will be signed out of your other sessions. You can reconnect it later."
                        action="Disconnect"
                        onConfirm={() => unlink(account)}
                      />
                    ) : (
                      <Badge variant="secondary">Only sign in method</Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {available.length > 0 && accounts !== null && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">Add another way to sign in</p>
              {fresh ? (
                <ProviderButtons
                  mode="link"
                  providers={available}
                  callbackURL="/account"
                  verb="Connect"
                />
              ) : (
                <p className="text-xs text-muted-foreground">Sign in again above to connect more accounts.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
