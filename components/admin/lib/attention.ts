import type { OpsAttention, OpsAttentionKind } from "@/lib/operator-contract";
import { activityHref } from "./activity-filters";
import { withInspect } from "./inspect";

/** One example row of an attention group. */
export type AttentionSample = OpsAttention["samples"][number];

/** Where an attention sample opens: the page that owns the entity its target names. */
export function attentionSampleHref({ target, recordingId }: Pick<AttentionSample, "target" | "recordingId">): string {
  switch (target.kind) {
    case "chunk": {
      const inspect = withInspect("", { kind: "chunk", id: target.id });
      return recordingId == null ? `/admin/activity${inspect}` : `/admin/recordings/${recordingId}${inspect}`;
    }
    case "recording":
      return `/admin/recordings/${target.id}`;
    case "streamer":
      return `/admin/streamers/${target.id}`;
    case "ingestion_job":
    case "dispatch":
      return "/admin/ingestion";
  }
}

/** Label and whole-group destination of each attention kind the overview lists. */
export const ATTENTION: Record<OpsAttentionKind, { label: string; href: string }> = {
  exhausted_chunk: { label: "Chunks out of retries", href: activityHref({ chunkStatus: "failed" }) },
  expired_lease: { label: "Expired leases", href: activityHref({ chunkStatus: "processing" }) },
  stale_queued: { label: "Stale in queue", href: activityHref({ chunkStatus: "queued" }) },
  dispatch_unconfirmed: { label: "Dispatch unconfirmed", href: "/admin/ingestion" },
  failing_ingestion: { label: "Failing ingestion jobs", href: "/admin/ingestion" },
  catalog_failed: { label: "Catalog failures", href: "/admin/ingestion" },
};
