"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { opsGet } from "@/lib/operator-client";
import { jumpHref, parseJump, type JumpTarget } from "../lib/jump";

/** State and submit handler for the jump box. */
export interface Jump {
  value: string;
  setValue: (value: string) => void;
  pending: boolean;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

async function resolveSource(target: Extract<JumpTarget, { kind: "source" }>): Promise<string | null> {
  try {
    const page = await opsGet("/recordings", { params: { platform: target.platform, q: target.sourceId, limit: 2 } });
    const matches = page.items.filter((item) => item.sourceId.toLowerCase() === target.sourceId.toLowerCase());
    return matches.length === 1 ? `/admin/recordings/${matches[0].id}` : null;
  } catch {
    return null;
  }
}

/**
 * Turn a pasted id or link into a console destination. A VOD link opens its
 * recording when exactly one matches, otherwise the filtered activity list.
 * @returns {@link Jump}
 */
export function useJump(): Jump {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = parseJump(value);
    if (!target || pending) return;
    setPending(true);
    const resolved = target.kind === "source" ? await resolveSource(target) : null;
    router.push(resolved ?? jumpHref(target, { pathname, search }), { scroll: target.kind !== "chunk" && target.kind !== "detection" });
    setPending(false);
    setValue("");
  };

  return { value, setValue, pending, submit: (event) => void submit(event) };
}
