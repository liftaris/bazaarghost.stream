"use client";

import { CornerDownLeft, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useJump } from "./hooks/use-jump";

/** Search field that jumps to a recording, chunk, detection or VOD link. */
export function JumpBox() {
  const { value, setValue, pending, submit } = useJump();
  return (
    <form role="search" aria-label="Jump to" onSubmit={submit} className="relative">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Jump to id or VOD link"
        aria-label="Jump to a recording id, chunk id, detection or VOD link"
        aria-busy={pending}
        spellCheck={false}
        autoComplete="off"
        className="h-8 bg-background pr-8 text-sm md:text-sm pointer-coarse:h-11 pointer-coarse:text-base"
      />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
        {pending ? (
          <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
        ) : (
          <CornerDownLeft className="size-3.5" />
        )}
      </span>
    </form>
  );
}
