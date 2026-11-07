import type { Metadata } from "next";
import { LandingCatalog } from "@/components/landing/landing-catalog";
import { getLandingSnapshot } from "@/lib/landing/snapshot";

/** Public entry point for searching and exploring the matchup archive. */
export const metadata: Metadata = {
  title: { absolute: "BazaarGhost" },
  description: "Bazaar ghost data from streams",
  alternates: { canonical: "/" },
};

/** The snapshot is hourly; serve the rendered page from cache and refresh it in the background. */
export const revalidate = 300;

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
    <main id="main" className="@container/landing mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-6 font-serif [--primary-foreground:var(--foreground)] dark:[--primary-foreground:var(--background)]">
      <LandingCatalog snapshot={snapshot} />
    </main>
  );
}
