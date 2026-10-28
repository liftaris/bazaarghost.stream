"use client";

import { useState } from "react";
import { format } from "date-fns";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/auth/auth-provider";
import { CredentialRow } from "@/components/auth/credential-row";
import { usePasskeyActions } from "@/hooks/use-passkey-actions";
import { passkeyLabel, type UserPasskey } from "@/lib/passkeys";

/** Lists the user's passkeys and adds or removes them; changes need a fresh sign in. */
export function PasskeysCard({
  fresh,
  passkeys,
  removable,
  onChange,
}: {
  fresh: boolean;
  passkeys: UserPasskey[] | null;
  removable: boolean;
  onChange: () => Promise<void>;
}) {
  const { post } = useAuth();
  const { add } = usePasskeyActions();
  const [adding, setAdding] = useState(false);

  async function create() {
    setAdding(true);
    const problem = await add();
    setAdding(false);
    if (problem) return void toast.error(problem);
    toast.success("Passkey added");
    await onChange();
  }

  async function remove(passkey: UserPasskey) {
    try {
      await post("/delete-passkey", { passkeyId: passkey.id });
      toast.success(`${passkeyLabel(passkey)} removed`);
      await onChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the passkey.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passkeys</CardTitle>
        <CardDescription>
          Sign in with your device&apos;s fingerprint, face, or screen lock. No password needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {passkeys === null ? (
          <Skeleton className="h-16 w-full" />
        ) : passkeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No passkeys yet.</p>
        ) : (
          <ul className="flex flex-col">
            {passkeys.map((passkey, index) => (
              <CredentialRow
                key={passkey.id}
                first={index === 0}
                icon={<KeyRound className="size-5 shrink-0" />}
                title={passkeyLabel(passkey)}
                detail={`Added ${format(new Date(passkey.createdAt), "PP")}`}
                removable={removable}
                fresh={fresh}
                verb="Remove"
                confirmTitle={`Remove ${passkeyLabel(passkey)}?`}
                confirmDescription="You will be signed out of your other sessions. The passkey stays in your password manager until you delete it there."
                onRemove={() => remove(passkey)}
              />
            ))}
          </ul>
        )}
        {fresh ? (
          <Button variant="outline" className="self-start" disabled={adding} onClick={create}>
            {adding ? <Spinner /> : <KeyRound />}
            Add a passkey
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Sign in again above to add a passkey.</p>
        )}
      </CardContent>
    </Card>
  );
}
