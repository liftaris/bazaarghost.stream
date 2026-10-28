"use client";

import { useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Text search that commits on Enter or clear, so typing never refetches.
 * Follows `value` when the URL changes underneath it.
 */
export function SearchField({
  value,
  onSearch,
  label,
  placeholder,
  className,
}: {
  value: string | undefined;
  /** Called with the trimmed query, or `undefined` when cleared. */
  onSearch: (q: string | undefined) => void;
  label: string;
  placeholder: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(value ?? "");
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(draft.trim() || undefined);
  };

  return (
    <form role="search" aria-label={label} onSubmit={submit} className={cn("relative min-w-48 flex-1", className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-8 pr-8 pl-8 text-sm md:text-sm"
      />
      {draft && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear search"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => {
            setDraft("");
            onSearch(undefined);
          }}
        >
          <X aria-hidden />
        </Button>
      )}
    </form>
  );
}
