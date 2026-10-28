"use client";

import { useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listPlatforms } from "@/lib/platforms/registry";
import { STATUS } from "../constants";
import { ACTIVITY_STATUSES, type ActivityFilters, type ActivityStatus } from "../lib/activity-filters";

const ANY = "any";

const statusLabel = (status: ActivityStatus) => (status === "attention" ? "Needs attention" : STATUS[status].label);

/** Status, platform and text filters for the activity list; every change goes to the URL. */
export function FilterBar({ filters, onChange }: { filters: ActivityFilters; onChange: (next: ActivityFilters) => void }) {
  const [draft, setDraft] = useState(filters.q ?? "");
  const [synced, setSynced] = useState(filters.q);
  if (synced !== filters.q) {
    setSynced(filters.q);
    setDraft(filters.q ?? "");
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange({ ...filters, q: draft.trim() || undefined });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.status ?? ANY}
        onValueChange={(value) => onChange({ ...filters, status: value === ANY ? undefined : (value as ActivityStatus) })}
      >
        <SelectTrigger size="sm" aria-label="Status" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any status</SelectItem>
          {ACTIVITY_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {statusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.platform ?? ANY}
        onValueChange={(value) => onChange({ ...filters, platform: value === ANY ? undefined : value })}
      >
        <SelectTrigger size="sm" aria-label="Platform" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any platform</SelectItem>
          {listPlatforms().map((platform) => (
            <SelectItem key={platform.id} value={platform.id}>
              {platform.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <form role="search" aria-label="Search recordings" onSubmit={submit} className="relative min-w-48 flex-1">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Title, streamer or source id"
          aria-label="Search recordings by title, streamer or source id"
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
              onChange({ ...filters, q: undefined });
            }}
          >
            <X aria-hidden />
          </Button>
        )}
      </form>
    </div>
  );
}
