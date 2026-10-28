"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { PasskeySignIn } from "@/components/auth/passkey-sign-in";
import { PasskeySignUp } from "@/components/auth/passkey-sign-up";
import { ProviderButtons } from "@/components/auth/provider-buttons";
import { safeNext } from "@/lib/auth-client";

/** Signs in with Discord, Twitch, or a passkey, or creates a passkey account, then follows `next`. */
export function LoginCard() {
  const { state, providersLoaded, ensureProviders } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  useEffect(() => {
    void ensureProviders();
  }, [ensureProviders]);

  useEffect(() => {
    if (state.status === "authenticated") router.replace(next);
  }, [state.status, next, router]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Image src="/logo.svg" alt="" width={48} height={30} className="mx-auto mb-2 object-contain" />
        <CardTitle className="text-2xl">Sign in to BazaarGhost</CardTitle>
        <CardDescription>
          Use a passkey, Discord, or Twitch. There are no passwords to remember.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "loading" ||
        state.status === "authenticated" ||
        (state.status === "anonymous" && !providersLoaded) ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : state.status === "disabled" ? (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Sign in is unavailable</AlertTitle>
            <AlertDescription>Try again in a little while.</AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col gap-2">
            <ProviderButtons callbackURL={next} />
            <PasskeySignIn />
            <p className="pt-3 text-center text-sm text-muted-foreground">New here?</p>
            <PasskeySignUp />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-center text-xs text-muted-foreground">
          From Discord and Twitch we only read your public username and avatar. No email, no
          servers, no messages. Signing in with them creates an account if you don&apos;t have
          one.
        </p>
      </CardFooter>
    </Card>
  );
}
