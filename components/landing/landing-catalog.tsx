import type { LandingSnapshot } from "@/lib/landing/types";
import { CatalogColumn } from "./catalog-column";

/** Render independent, server-cached discovery feeds without client API requests. */
export function LandingCatalog({
  snapshot,
}: {
  snapshot: LandingSnapshot | null;
}) {
  return (
    <div>
      <div
        className="grid border-y border-border @4xl/landing:grid-cols-[1fr_1fr_1.1fr]"
        aria-label="Explore the archive"
      >
        <CatalogColumn
          title="Streamers"
          total={snapshot?.stats.streamers}
          href="/streamers"
          context="All streamers"
          entries={snapshot?.streamers ?? []}
          speed={1}
          empty={snapshot ? "No streamers indexed yet" : "Preview unavailable"}
        />
        <CatalogColumn
          title="Recordings"
          total={snapshot?.stats.recordings}
          href="/recordings"
          context="From the last 24 hours"
          entries={snapshot?.recordings ?? []}
          speed={2}
          empty={
            snapshot
              ? "No recordings from the last 24 hours"
              : "Preview unavailable"
          }
        />
        <CatalogColumn
          title="Ghosts"
          total={snapshot?.stats.matchups}
          href="/search"
          context="A mix of recent ghosts"
          entries={snapshot?.ghosts ?? []}
          speed={3}
          empty={snapshot ? "No recent ghosts found" : "Preview unavailable"}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
        <p className="motion-reduce:hidden">
          Hover or focus a column to pause.
        </p>
        {snapshot ? (
          <p>
            Refreshes hourly ·{" "}
            <time
              dateTime={snapshot.generatedAt}
              title={`Recording window: ${snapshot.recordingsFrom} to ${snapshot.generatedAt}`}
            >
              Updated {snapshot.generatedAt.slice(11, 16)} UTC
            </time>
          </p>
        ) : (
          <p>
            The archive preview couldn’t load. You can still browse or search.
          </p>
        )}
      </div>
    </div>
  );
}
