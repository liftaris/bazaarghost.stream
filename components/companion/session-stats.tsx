"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Image from "next/image";
import type { Matchup } from "@/lib/api-contract";
import { heroLabel, summarizeSession } from "@/lib/session-summary";

export function SessionStats({ matches }: { matches: Matchup[] }) {
  const stats = useMemo(() => summarizeSession(matches), [matches]);
  const knownRanks = stats.count - stats.unknownRanks;
  const maxRank = Math.max(1, ...stats.ranks.map(({ count }) => count));
  const maxHero = Math.max(1, ...stats.heroes.map(({ count }) => count));
  return (
    <Collapsible defaultOpen className="flex flex-col gap-2" data-session-stats>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="group w-full justify-between"
        >
          Session stats
          <ChevronDown
            data-icon="inline-end"
            className="transition-transform group-data-[state=closed]:-rotate-90 motion-reduce:transition-none"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-2 gap-2 @lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1.25fr)]">
          <section
            aria-label="Win / loss"
            className="flex min-w-0 flex-col gap-2 rounded-md border border-border bg-background p-2"
          >
            <h3 className="text-xs font-medium">Win / loss</h3>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-muted-foreground">Wins</dt>
                <dd className="text-xl font-medium tabular-nums">
                  {stats.wins ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Losses</dt>
                <dd className="text-xl font-medium tabular-nums">
                  {stats.losses ?? "-"}
                </dd>
              </div>
            </dl>
          </section>
          <section
            aria-label="Opponent ranks"
            className="flex min-w-0 flex-col gap-2 rounded-md border border-border bg-background p-2"
          >
            <h3 className="text-xs font-medium">Opponent ranks</h3>
            <dl className="flex flex-1 items-end justify-between gap-1">
              {stats.ranks.map(({ rank, count }) => (
                <div
                  key={rank}
                  className="flex min-w-0 flex-1 flex-col-reverse items-center gap-1"
                >
                  <dt>
                    <Image
                      src={`/${rank}.webp`}
                      alt={rank}
                      width={20}
                      height={20}
                      unoptimized
                      className="size-5 object-contain"
                    />
                  </dt>
                  <dd className="flex w-full flex-col items-center gap-1 text-xs tabular-nums">
                    <span>{knownRanks ? count : "-"}</span>
                    <span
                      aria-hidden
                      className="flex h-6 w-3 items-end rounded-sm bg-muted"
                    >
                      <span
                        data-chart-bar
                        className="w-full rounded-sm bg-[color-mix(in_srgb,var(--chart-3)_80%,var(--foreground))]"
                        style={{ height: `${(count / maxRank) * 100}%` }}
                      />
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            {stats.unknownRanks > 0 && (
              <p className="text-xs text-muted-foreground">
                {stats.unknownRanks} without rank data
              </p>
            )}
          </section>
          <section
            aria-label="Heroes faced"
            className="col-span-2 flex min-w-0 flex-col gap-2 rounded-md border border-border bg-background p-2 @lg:col-span-1"
          >
            <h3 className="text-xs font-medium">Heroes faced</h3>
            {stats.heroes.length ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 @lg:grid-cols-1 @3xl:grid-cols-2">
                {stats.heroes.map(({ hero, count }) => (
                  <div key={hero} className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <dt className="truncate">{heroLabel(hero)}</dt>
                      <dd className="tabular-nums text-muted-foreground">
                        {count}
                      </dd>
                    </div>
                    <div aria-hidden className="mt-1 h-1 rounded-full bg-muted">
                      <div
                        data-chart-bar
                        className="h-full rounded-full bg-[color-mix(in_srgb,var(--chart-3)_80%,var(--foreground))]"
                        style={{ width: `${(count / maxHero) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-2xl font-medium">-</p>
            )}
            {stats.unknownHeroes > 0 && (
              <p className="text-xs text-muted-foreground">
                {stats.unknownHeroes} without hero data
              </p>
            )}
          </section>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
