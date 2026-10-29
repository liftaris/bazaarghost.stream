"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Search } from "lucide-react";
import Image from "next/image";
import type { Matchup, Session } from "@/lib/api-contract";
import { canSearchOpponent, opponentLabel } from "@/lib/opponent-name";
import { RANKS } from "@/lib/session-summary";
import { clock, matchupTime } from "@/lib/session-navigation";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/social/bookmark-button";
import { HeroIcon } from "@/components/hero-icon";

/** Selected canonical metadata and deliberate related searches, without evidence-image downloads. */
export function MatchupDetail({
  match,
  runNumber = null,
  recordingId = null,
  session = null,
}: {
  match: Matchup;
  runNumber?: number | null;
  recordingId?: number | null;
  session?: Session | null;
}) {
  const router = useRouter();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const { opponent, encounter } = match;
  const rank = opponent.rank?.trim().toLowerCase();
  const source = match.sources?.find(
    (source) => source.kind === "recording" && source.available
  );
  const at =
    (recordingId == null ? null : matchupTime(match, recordingId, session)) ??
    (source?.kind === "recording" ? source.at : null);
  const fragment =
    opponent.nameState === "partial" || opponent.nameState === "obstructed";
  return (
    <section
      aria-label="Selected player"
      className="flex flex-col gap-2 rounded-md border border-primary bg-background p-3"
      data-matchup-detail={match.id}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h4 className="min-w-0 break-words text-lg font-semibold">
          {opponentLabel(opponent)}
        </h4>
        <HeroIcon hero={encounter.ghostHero} />
        {rank && RANKS.some((value) => value === rank) && (
          <Image
            src={`/${rank}.webp`}
            alt={rank}
            width={20}
            height={20}
            unoptimized
            className="size-5 shrink-0 object-contain"
          />
        )}
        <span className="text-sm capitalize text-muted-foreground">
          {opponent.rank ?? "-"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Run {runNumber ?? "-"} · Day {encounter.igd ?? "-"} · at{" "}
        {at == null ? "-" : clock(at)}
      </p>
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
          variant="ghost"
          size="sm"
          disabled={!canSearchOpponent(opponent)}
          onClick={() =>
            router.push(`/search?q=${encodeURIComponent(opponent.username!)}`, {
              scroll: false,
            })
          }
        >
          <Search data-icon="inline-start" /> Search {opponentLabel(opponent)}
        </Button>
        {match.streamer && (
          <Button
            variant="ghost"
            size="sm"
            disabled={!canSearchOpponent(opponent)}
            onClick={() =>
              router.push(
                `/search?streamer=${match.streamer!.id}&q=${encodeURIComponent(opponent.username!)}`,
                {
                  scroll: false,
                }
              )
            }
          >
            Also vs {match.streamer.displayName}
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
