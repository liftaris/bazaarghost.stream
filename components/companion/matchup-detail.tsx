"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Search } from "lucide-react";
import type { Matchup } from "@/lib/api-contract";
import { canSearchOpponent } from "@/lib/opponent-name";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/social/bookmark-button";

/** Selected canonical metadata and deliberate related searches, without evidence-image downloads. */
export function MatchupDetail({ match }: { match: Matchup }) {
  const router = useRouter();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const { opponent, encounter } = match;
  const fragment =
    opponent.nameState === "partial" || opponent.nameState === "obstructed";
  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-3 pb-4 pt-1 @sm:px-4"
      data-matchup-detail={match.id}
    >
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <div>
          <dt className="text-muted-foreground">In-game day</dt>
          <dd className="mt-0.5 font-medium">{encounter.igd ?? "Unknown"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rank</dt>
          <dd className="mt-0.5 font-medium capitalize">
            {opponent.rank ?? "Unknown"}
          </dd>
        </div>
        {encounter.winsRemaining !== null && (
          <div>
            <dt className="text-muted-foreground">Wins remaining</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {encounter.winsRemaining}
            </dd>
          </div>
        )}
        {encounter.lethal !== null && (
          <div>
            <dt className="text-muted-foreground">Lethal</dt>
            <dd className="mt-0.5 font-medium">
              {encounter.lethal ? "Yes" : "No"}
            </dd>
          </div>
        )}
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
    </div>
  );
}
