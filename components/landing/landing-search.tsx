"use client";

import { useContext, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SearchHandoffContext } from "@/components/search-handoff";
import { ModeChips } from "@/components/search/mode-chips";
import { StreamerPicker } from "@/components/search/streamer-picker";
import { modeOptions } from "@/components/search/constants";
import { MODE_PATHS } from "@/components/search/lib/route-utils";
import { useStreamerOptions } from "@/components/search/hooks/use-streamer-options";
import type { SearchMode } from "@/components/search/types";

type Mode = Exclude<SearchMode, "saved">;

const labels: Record<Mode, string> = {
  ghosts: "Your in-game name",
  streamers: "Streamer name",
  recordings: "Recording title",
};

function preloadWorkspace() {
  void import("@/components/search");
}

export function LandingSearch() {
  const router = useRouter();
  const handoffRef = useContext(SearchHandoffContext);
  const navigating = useRef(false);
  const composing = useRef(false);
  const [mode, setMode] = useState<Mode>("ghosts");
  const [streamerId, setStreamerId] = useState<string | null>(null);
  const picker = useStreamerOptions({ streamerId, onSelect: setStreamerId });
  const hasPicker = mode === "ghosts" || mode === "recordings";
  const streamer = hasPicker ? streamerId : null;

  function search(value: string, submit = false) {
    const query = value.trim();
    if (navigating.current) {
      if (handoffRef) handoffRef.current = query;
      return;
    }
    if (!submit && query.length < 2) return;
    navigating.current = true;
    if (handoffRef) handoffRef.current = query;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (streamer) params.set("streamer", streamer);
    router.push(`${MODE_PATHS[mode]}${params.size ? `?${params}` : ""}`, {
      scroll: false,
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    search(typeof value === "string" ? value : "", true);
  }

  return (
    <form
      action={MODE_PATHS[mode]}
      method="get"
      onSubmit={submit}
      onPointerEnter={preloadWorkspace}
      onFocus={preloadWorkspace}
      role="search"
      aria-label="Find your ghost"
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-center">
          <ModeChips mode={mode} onChange={setMode} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {streamer && <input type="hidden" name="streamer" value={streamer} />}
          {hasPicker && (
            <StreamerPicker
              options={picker.options}
              query={picker.pickerQuery}
              onQuery={picker.setPickerQuery}
              hasMore={picker.hasMore}
              onLoadMore={picker.loadMore}
              resolved={picker.resolved}
              streamerId={streamerId}
              open={picker.open}
              onOpenChange={picker.setOpen}
              onSelect={picker.select}
              triggerClassName="h-14 w-auto max-w-48 shrink-0"
            />
          )}
          {mode === "ghosts" && (
            <span className="shrink-0 text-sm text-muted-foreground">vs</span>
          )}
          <Input
            name="q"
            type="search"
            aria-label={labels[mode]}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              if (!composing.current) search(event.currentTarget.value);
            }}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={(event) => {
              composing.current = false;
              search(event.currentTarget.value);
            }}
            placeholder={modeOptions.find((o) => o.value === mode)?.placeholder}
            className="h-14 min-w-40 flex-1"
          />
        </div>
      </div>
    </form>
  );
}
