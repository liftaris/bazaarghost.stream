"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Ghost, Search } from "lucide-react";
import Image from "next/image";
import type { Matchup } from "@/lib/api-contract";
import { canSearchOpponent, opponentLabel } from "@/lib/opponent-name";
import { heroLabel, RANKS } from "@/lib/session-summary";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/social/bookmark-button";

/** Selected canonical metadata and deliberate related searches, without evidence-image downloads. */
export function MatchupDetail({ match }: { match: Matchup }) {
  const router = useRouter();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const { opponent, encounter } = match;
  const rank = opponent.rank?.trim().toLowerCase();
  const fragment =
    opponent.nameState === "partial" || opponent.nameState === "obstructed";
  return (
    <section
      aria-label="Selected player"
      className="mx-3 mb-3 flex flex-col gap-3 rounded-md border border-border bg-background p-3 @sm:mx-4"
      data-matchup-detail={match.id}
    >
      <div className="flex min-w-0 items-center gap-3 border-b border-border pb-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <Ghost aria-hidden className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium">
            {opponentLabel(opponent)}
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {heroLabel(encounter.ghostHero)}
          </p>
        </div>
        {rank && RANKS.some((value) => value === rank) && (
          <Image
            src={`/${rank}.webp`}
            alt={rank}
            width={28}
            height={28}
            unoptimized
            className="size-7 shrink-0 object-contain"
          />
        )}
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Ghost hero</dt>
          <dd className="mt-0.5 font-medium">
            {heroLabel(encounter.ghostHero)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Streamer hero</dt>
          <dd className="mt-0.5 font-medium">
            {heroLabel(encounter.streamerHero)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">In-game day</dt>
          <dd className="mt-0.5 font-medium">{encounter.igd ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rank</dt>
          <dd className="mt-0.5 font-medium capitalize">
            {opponent.rank ?? "-"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Wins remaining</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {encounter.winsRemaining ?? "-"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Lethal</dt>
          <dd className="mt-0.5 font-medium">
            {encounter.lethal == null ? "-" : encounter.lethal ? "Yes" : "No"}
          </dd>
        </div>
      </dl>
      {fragment && (
        <p className="max-w-prose text-xs text-muted-foreground">
          Observed text is incomplete or obstructed, not a verified opponent
          identity. Name search is unavailable.
        </p>
      )}
      {opponent.nameState === "masked" && (
        <p className="text-xs text-muted-foreground">
          The opponent name was hidden in the recording.
        </p>
      )}
      {!opponent.username && opponent.nameState !== "masked" && (
        <p className="text-xs text-muted-foreground">
          The opponent name could not be read. This matchup still has a stable
          link.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <BookmarkButton matchupId={match.id} tooltip />
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${window.location.origin}/matchups/${match.id}`
              );
              setCopyStatus("copied");
            } catch {
              setCopyStatus("failed");
            }
          }}
        >
          {copyStatus === "copied" ? (
            <Check data-icon="inline-start" />
          ) : (
            <Copy data-icon="inline-start" />
          )}
          {copyStatus === "copied" ? "Copied" : "Matchup link"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canSearchOpponent(opponent)}
          onClick={() =>
            router.push(`/search?q=${encodeURIComponent(opponent.username!)}`, {
              scroll: false,
            })
          }
        >
          <Search data-icon="inline-start" /> More with this name
        </Button>
        {match.streamer && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/search?streamer=${match.streamer!.id}`, {
                scroll: false,
              })
            }
          >
            Matchups from {match.streamer.displayName}
          </Button>
        )}
      </div>
      {copyStatus === "failed" && (
        <p role="status" className="text-xs text-muted-foreground">
          Could not copy the link. Try again.
        </p>
      )}
    </section>
  );
}
