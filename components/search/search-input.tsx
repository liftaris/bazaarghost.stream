"use client";

import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useContext, useLayoutEffect, useRef } from "react";
import { SearchHandoffContext } from "@/components/search-handoff";
import { useWorkspaceActive } from "@/components/workspace-context";

/**
 * Props for {@link SearchInput}.
 */
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isLoading?: boolean;
}

/**
 * Controlled text input with a leading search icon and an optional trailing
 * loading spinner.
 *
 * Used as the query input across all search modes (ghost username, VOD title,
 * streamer name).
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  isLoading,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handoffRef = useContext(SearchHandoffContext);
  const active = useWorkspaceActive();
  useLayoutEffect(() => {
    if (!active || !handoffRef || handoffRef.current === null) return;
    const { query, complete } = handoffRef.current;
    handoffRef.current = null;
    if (query !== value) onChange(query);
    inputRef.current?.focus({ preventScroll: true });
    inputRef.current?.setSelectionRange(query.length, query.length);
    complete();
  }, [active, handoffRef, onChange, value]);
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        aria-label={placeholder.replace(/\.+$/, "")}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 border-border bg-card pl-9 pr-8 text-sm placeholder:text-muted-foreground focus-visible:ring-primary [view-transition-name:nav-search]"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
