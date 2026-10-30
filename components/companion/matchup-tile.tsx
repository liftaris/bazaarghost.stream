"use client";

import Image from "next/image";
import { Ghost } from "lucide-react";
import type { Matchup, Session } from "@/lib/api-contract";
import { clock, matchupTime } from "@/lib/session-navigation";
import { heroLabel, RANKS } from "@/lib/session-summary";
import { opponentLabel } from "@/lib/opponent-name";
import { Button } from "@/components/ui/button";
import { HeroIcon } from "@/components/hero-icon";

export function MatchupTile({
  match,
  selected,
  active,
  recordingId,
  session,
  onSelect,
}: {
  match: Matchup;
  selected: boolean;
  active: boolean;
  recordingId: number | null;
  session: Session | null;
  onSelect: (match: Matchup) => void;
}) {
  const mapped =
    recordingId === null ? null : matchupTime(match, recordingId, session);
  const own = match.sources.find(
    (source) => source.kind === "recording" && source.available
  );
  const at = mapped ?? (own?.kind === "recording" ? own.at : null);
  const rank = match.opponent.rank?.trim().toLowerCase();
  const label = `${opponentLabel(match.opponent)}, ${match.encounter.igd == null ? "day unknown" : `day ${match.encounter.igd}`}, ${heroLabel(match.encounter.ghostHero)}, ${rank ?? "rank unknown"}, ${at === null ? "time unknown" : clock(at)}${mapped === null && own ? `, ${own.platform} source` : ""}${active ? ", at playhead" : ""}`;
  return (
    <Button
      id={`matchup-tile-${match.id}`}
      variant="matchup"
      type="button"
      aria-current={active ? "time" : undefined}
      aria-pressed={selected}
      data-playing={active}
      aria-label={label}
      title={label}
      disabled={!own}
      onClick={() => onSelect(match)}
      className="h-20 w-full min-w-0 flex-col gap-2 rounded-md p-2"
      data-matchup-tile={match.id}
    >
      <span className="flex w-full items-center justify-between gap-1">
        {rank && RANKS.some((value) => value === rank) ? (
          <Image
            src={`/${rank}.webp`}
            alt=""
            width={18}
            height={18}
            unoptimized
            className="size-[18px] object-contain"
          />
        ) : (
          <Ghost aria-hidden />
        )}
        <HeroIcon hero={match.encounter.ghostHero} />
      </span>
      <span className="w-full truncate text-left text-xs leading-4">
        {opponentLabel(match.opponent)}
      </span>
    </Button>
  );
}
