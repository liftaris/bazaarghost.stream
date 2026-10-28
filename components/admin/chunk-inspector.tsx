"use client";

import Link from "next/link";
import { ChunkDetails } from "./chunk-details";
import { useInspectParam } from "./hooks/use-inspect-param";
import { useOpsResource } from "./hooks/use-ops-resource";
import { EmptyState, ErrorState, RowsSkeleton } from "./load-states";

/** Loads one chunk into the inspector, with loading, missing and error states. */
export function ChunkInspector({ id }: { id: string }) {
  const { data, error, reload } = useOpsResource("/chunks/:id", { id });
  const { hrefFor } = useInspectParam();

  if (error?.status === 404)
    return (
      <EmptyState title="No chunk has this id">
        Chunk and detection ids look alike.{" "}
        <Link
          href={hrefFor({ kind: "detection", id })}
          scroll={false}
          className="text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          Open it as a detection
        </Link>
      </EmptyState>
    );
  if (error) return <ErrorState title="Could not load this chunk" error={error} onRetry={reload} />;
  if (!data) return <RowsSkeleton rows={8} />;
  return <ChunkDetails detail={data} />;
}
