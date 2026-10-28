"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { usePasskeyActions } from "@/hooks/use-passkey-actions";

/** Signs in with a saved passkey; also re-confirms identity when a fresh sign in is needed. */
export function PasskeySignIn({ label = "Sign in with a passkey" }: { label?: string }) {
  const { signIn } = usePasskeyActions();
  const [pending, setPending] = useState(false);

  async function go() {
    setPending(true);
    const problem = await signIn();
    setPending(false);
    if (problem) toast.error(problem);
  }

  return (
    <Button variant="outline" size="lg" disabled={pending} onClick={go}>
      {pending ? <Spinner /> : <KeyRound />}
      {label}
    </Button>
  );
}
