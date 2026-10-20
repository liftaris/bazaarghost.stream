"use client";

import { memo } from "react";
import { Ghost, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SourceStack } from "@/components/source-stack";
import type { SessionCard, StreamerCard } from "@/lib/api-contract";
import { cn } from "@/lib/utils";

export type StreamerCardData = StreamerCard;
export type SessionCardData = SessionCard;

/** Placeholder row shell shared by the adapters below; the leaf components replace it. */
function RowShell({ highlighted, onSelect, onPrefetch, children }: {
  highlighted: boolean; onSelect: () => void; onPrefetch?: () => void; children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(); } }}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      aria-current={highlighted ? "true" : undefined}
      className={cn(
        "box-border flex h-[72px] w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        highlighted ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50",
      )}
    >
      {children}
    </div>
  );
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}h${String(m).padStart(2, "0")}` : `${m}m`;
}

export const StreamerRow = memo(function StreamerRow({ streamer, selected, onSelect, onPrefetch }: {
  streamer: StreamerCardData; selected?: boolean; onSelect: () => void; onPrefetch?: () => void;
}) {
  return (
    <RowShell highlighted={!!selected} onSelect={onSelect} onPrefetch={onPrefetch}>
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={streamer.avatarUrl ?? undefined} alt="" />
        <AvatarFallback className="bg-primary text-xs text-primary-foreground">{streamer.displayName[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-card-foreground">{streamer.displayName}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 tabular-nums"><Video aria-label="Recordings" className="size-3" />{streamer.sessionCount}</span>
          <span className="inline-flex items-center gap-1 tabular-nums"><Ghost aria-label="Ghosts" className="size-3" />{streamer.matchupCount}</span>
        </p>
      </div>
      <SourceStack sources={streamer.platforms.map((platform) => ({ platform }))} />
    </RowShell>
  );
});

export const RecordingRow = memo(function RecordingRow({ session, selected, active, onSelect, onPrefetch }: {
  session: SessionCardData; selected?: boolean; active?: boolean; onSelect: () => void; onPrefetch?: () => void;
}) {
  const owner = session.streamer ?? session.channel;
  const date = session.startedAt ? new Date(session.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
  const meta = [formatDuration(session.durationSeconds), date].filter(Boolean).join(" · ");
  return (
    <RowShell highlighted={!!selected || !!active} onSelect={onSelect} onPrefetch={onPrefetch}>
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={owner.avatarUrl ?? undefined} alt="" />
        <AvatarFallback className="bg-primary text-xs text-primary-foreground">{owner.displayName[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-card-foreground">{session.title ?? owner.displayName}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{meta}</span>
          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums"><Ghost aria-label="Ghosts" className="size-3" />{session.matchupCount}</span>
        </p>
      </div>
      <SourceStack sources={session.platforms.map((platform) => ({ platform }))} />
    </RowShell>
  );
});
