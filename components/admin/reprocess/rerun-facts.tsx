import Link from "next/link";
import type { OpsRecording } from "@/lib/operator-contract";
import { FactList } from "../data-table";
import { IdChip } from "../id-chip";
import { formatCount } from "../lib/format";

const TEMPLATE: Record<OpsRecording["templateVersion"], string> = { auto: "Auto", old: "Old", current: "Current" };

/** What a rerun records and keeps, none of which the operator picks: runtime image, recording settings, existing detections. */
export function RerunFacts({
  runtimeImage,
  recording,
  detections,
}: {
  /** The image this deployment pins for the next run; null when the workflow builds from the branch. */
  runtimeImage: string | null;
  recording: OpsRecording;
  detections: number;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted/60 p-3">
      <FactList
        facts={[
          [
            "Runtime image",
            runtimeImage ? (
              <IdChip value={runtimeImage} label="Copy runtime image" className="max-w-full" />
            ) : (
              "None pinned; built from the branch"
            ),
          ],
          ["Profile", recording.profile?.name ?? "Default"],
          ["Template", TEMPLATE[recording.templateVersion]],
          ["Detections in range", formatCount(detections)],
        ]}
      />
      <p className="text-xs text-muted-foreground">
        Profile and template are settings of the{" "}
        <Link
          href={`/admin/recordings/${recording.id}`}
          className="text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          recording
        </Link>
        , not of this run.
        {recording.templateVersion === "old" && " Old-template recordings process at 480p whatever you pick."}
      </p>
      <p className="text-xs text-muted-foreground">
        A rerun keeps existing detections. It updates the ones at the same second and adds new ones; ones it no longer
        finds stay.
      </p>
    </div>
  );
}
