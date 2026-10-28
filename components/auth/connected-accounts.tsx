"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
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
import { CredentialRow } from "@/components/auth/credential-row";
import { ProviderButtons } from "@/components/auth/provider-buttons";
import { PROVIDERS, isKnownProvider } from "@/components/auth/provider-icons";
import type { LinkedAccount } from "@/lib/auth-client";

/** Lists Discord and Twitch accounts that sign in to this profile, and connects or disconnects them. */
export function ConnectedAccounts({
  fresh,
  accounts,
  removable,
  onChange,
}: {
  fresh: boolean;
  accounts: LinkedAccount[] | null;
  removable: boolean;
  onChange: () => Promise<void>;
}) {
  const { providers, post, ensureProviders } = useAuth();

  useEffect(() => {
    void ensureProviders();
  }, [ensureProviders]);

  async function unlink(account: LinkedAccount, label: string) {
    try {
      await post("/unlink-account", { accountId: account.id });
      toast.success(`${label} disconnected`);
      await onChange();
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
          Any connected account or passkey signs you in to this profile. Keep at least one.
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
              const label = meta?.label ?? account.providerId;
              return (
                <CredentialRow
                  key={account.id}
                  first={index === 0}
                  icon={meta && <meta.Icon className="size-5 shrink-0" />}
                  title={label}
                  detail={`Connected ${format(new Date(account.createdAt), "PP")}`}
                  removable={removable}
                  fresh={fresh}
                  verb="Disconnect"
                  confirmTitle={`Disconnect ${meta?.label ?? "this account"}?`}
                  confirmDescription="You will be signed out of your other sessions. You can reconnect it later."
                  onRemove={() => unlink(account, label)}
                />
              );
            })}
          </ul>
        )}
        {available.length > 0 && accounts !== null && (
          <>
            {accounts.length > 0 && <Separator />}
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
