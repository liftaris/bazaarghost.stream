"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { ConfirmAction } from "@/components/auth/confirm-action";

export function DangerZone({ fresh }: { fresh: boolean }) {
  const { post, refresh } = useAuth();
  const router = useRouter();

  async function remove() {
    try {
      await post("/delete-account");
      toast.success("Your account was deleted");
      await refresh();
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete your account.");
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          Permanently removes your profile, connected accounts, sessions, and anything you
          liked or commented on. This can&apos;t be undone.
        </CardDescription>
        <CardAction>
          <ConfirmAction
            destructive
            trigger={
              <Button variant="destructive" size="sm" disabled={!fresh}>
                Delete account
              </Button>
            }
            title="Delete your account?"
            description="This permanently removes your profile and everything tied to it."
            action="Delete account"
            onConfirm={remove}
          />
        </CardAction>
      </CardHeader>
    </Card>
  );
}
