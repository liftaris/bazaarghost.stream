"use client";

import { useCallback, useId, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { usePasskeyActions } from "@/hooks/use-passkey-actions";
import { DISPLAY_NAME_MAX, displayNameProblem } from "@/lib/passkeys";

/** Creates an account from a display name and a new passkey, without Discord or Twitch. */
export function PasskeySignUp() {
  const { signUp } = usePasskeyActions();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const focusOnOpen = useCallback((input: HTMLInputElement | null) => input?.focus(), []);

  if (!open)
    return (
      <Button variant="ghost" size="lg" onClick={() => setOpen(true)}>
        <UserPlus />
        Create an account with a passkey
      </Button>
    );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const invalid = displayNameProblem(name);
    if (invalid) return setProblem(invalid);
    setPending(true);
    setProblem(await signUp(name));
    setPending(false);
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
      <Field data-invalid={problem !== null}>
        <FieldLabel htmlFor={id}>Display name</FieldLabel>
        <Input
          id={id}
          ref={focusOnOpen}
          autoComplete="nickname"
          value={name}
          aria-invalid={problem !== null}
          onChange={(event) => {
            setName(event.target.value);
            setProblem(null);
          }}
        />
        <FieldDescription>
          Shown on your comments. Up to {DISPLAY_NAME_MAX} characters.
        </FieldDescription>
        {problem && <FieldError>{problem}</FieldError>}
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Spinner />}
        Create account
      </Button>
    </form>
  );
}
