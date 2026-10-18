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
import { ProviderButtons } from "@/components/auth/provider-buttons";
import { safeNext } from "@/lib/auth-client";

export function LoginCard() {
  const { state, providers } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  useEffect(() => {
    if (state.status === "authenticated") router.replace(next);
  }, [state.status, next, router]);

  const unavailable =
    state.status === "disabled" || (state.status === "anonymous" && providers.length === 0);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Image src="/logo.svg" alt="" width={48} height={30} className="mx-auto mb-2 object-contain" />
        <CardTitle className="text-2xl">Sign in to BazaarGhost</CardTitle>
        <CardDescription>
          Use the account you already have. There are no passwords to remember.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "loading" || state.status === "authenticated" ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : unavailable ? (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Sign in is unavailable</AlertTitle>
            <AlertDescription>Try again in a little while.</AlertDescription>
          </Alert>
        ) : (
          <ProviderButtons callbackURL={next} />
        )}
      </CardContent>
      <CardFooter>
        <p className="text-center text-xs text-muted-foreground">
          We only read your public username and avatar. No email, no servers, no
          messages. Signing in creates an account if you don&apos;t have one.
        </p>
      </CardFooter>
    </Card>
  );
}
