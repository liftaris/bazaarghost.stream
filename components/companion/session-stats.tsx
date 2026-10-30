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
import { summarizeSession } from "@/lib/session-summary";
import { HeroIcon } from "@/components/hero-icon";

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
        <div className="grid grid-cols-2 items-start gap-2 @lg:grid-cols-[8.5rem_8.5rem_minmax(0,1fr)]">
          <section
            aria-label="Runs"
            className="flex aspect-square min-w-0 flex-col gap-2 rounded-md border border-border bg-background p-2"
          >
            <h3 className="text-center text-xs font-medium">Runs</h3>
            <p className="flex flex-1 items-center justify-center text-3xl font-medium tabular-nums">
              {stats.runCount}
            </p>
          </section>
          <section
            aria-label="Opponent ranks"
            className="flex aspect-square min-w-0 flex-col gap-1 rounded-md border border-border bg-background p-2"
          >
            <h3 className="text-center text-xs font-medium">Opponent ranks</h3>
            <dl className="flex min-h-0 flex-1 justify-center gap-1">
              {stats.ranks.map(({ rank, count }) => (
                <div
                  key={rank}
                  className="flex w-5 min-w-0 flex-col-reverse items-center gap-1"
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
                  <dd className="flex min-h-0 w-full flex-1 flex-col items-center gap-1 text-xs tabular-nums">
                    <span>{knownRanks ? count : "-"}</span>
                    <span
                      aria-hidden
                      className="flex min-h-0 w-3 flex-1 items-end rounded-sm bg-muted"
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
              <p
                className="text-center text-xs text-muted-foreground"
                title="Without rank data"
              >
                {stats.unknownRanks} unknown
              </p>
            )}
          </section>
          <section
            aria-label="Heroes faced"
            className="@container col-span-2 flex min-w-0 flex-col gap-2 self-stretch rounded-md border border-border bg-background p-2 @lg:col-span-1"
          >
            <h3 className="text-center text-xs font-medium">Heroes faced</h3>
            {stats.heroes.length ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 @sm:grid-cols-4">
                {stats.heroes.map(({ hero, count }) => (
                  <div key={hero} className="min-w-0">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <dt>
                        <HeroIcon hero={hero} />
                      </dt>
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
              <p className="text-center text-2xl font-medium">-</p>
            )}
            {stats.unknownHeroes > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                {stats.unknownHeroes} without hero data
              </p>
            )}
          </section>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
