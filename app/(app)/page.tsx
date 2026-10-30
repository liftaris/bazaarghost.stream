import type { Metadata } from "next";
import Link from "next/link";
import { LandingCatalog } from "@/components/landing/landing-catalog";
import { LandingSearch } from "@/components/landing/landing-search";
import { getLandingSnapshot } from "@/lib/landing/snapshot";

/** Public entry point for searching and exploring the matchup archive. */
export const metadata: Metadata = {
  title: { absolute: "BazaarGhost" },
  description: "Bazaar ghost data from streams",
  alternates: { canonical: "/" },
};

/** Search-first landing page with an hourly public archive snapshot. */
export default async function RootPage() {
  const snapshot = await getLandingSnapshot().catch((error: unknown) => {
    console.error({
      event: "landing_snapshot_failed",
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  });
  return (
    <main className="@container/landing mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-6 font-serif [--primary-foreground:var(--foreground)] dark:[--primary-foreground:var(--background)]">
      <div className="grid gap-8 py-10 @4xl/landing:grid-cols-2 @4xl/landing:items-center @4xl/landing:gap-16 @4xl/landing:py-14">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl leading-none tracking-tight text-hero-muted @lg/landing:text-6xl dark:text-primary">
            BazaarGhost
          </h1>
          <p className="text-xl text-muted-foreground @lg/landing:text-2xl">
            Bazaar ghost data from streams
          </p>
        </div>
        <LandingSearch />
      </div>
      <LandingCatalog snapshot={snapshot} />
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-border py-6 text-sm text-muted-foreground">
        <p>Streamers, their VODs, your matchups.</p>
        <div className="flex flex-wrap gap-6">
          <Link
            className="rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            href="/how-it-works"
          >
            How it works
          </Link>
          <Link
            className="rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            href="/contact"
          >
            Contact
          </Link>
          <Link
            className="rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            href="/donate"
          >
            Support the project
          </Link>
        </div>
      </footer>
    </main>
  );
}
