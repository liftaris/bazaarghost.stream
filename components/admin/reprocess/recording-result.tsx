import type { OpsReprocessRecording } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { FAILED_TEXT, MONO } from "../constants";
import type { ChunkLabel } from "../lib/reprocess";

function ChunkList({ ids, label }: { ids: readonly string[]; label: ChunkLabel }) {
  return (
    <ul className="flex flex-wrap gap-x-2 gap-y-0.5">
      {ids.map((id) => (
        <li key={id} title={id} className="text-xs">
          {label(id)}
        </li>
      ))}
    </ul>
  );
}

/** One recording's share of a reprocess response: what queued, what was skipped and why, and the payload. */
export function RecordingResult({
  result,
  dryRun,
  chunkLabel,
}: {
  result: OpsReprocessRecording;
  dryRun: boolean;
  chunkLabel: ChunkLabel;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0">
      <p className="text-xs font-medium text-muted-foreground tabular-nums">Recording {result.recordingId}</p>
      {result.error && <p className={cn("text-xs break-words", MONO, FAILED_TEXT)}>{result.error}</p>}
      {result.chunkIds.length > 0 && (
        <div className="flex flex-col gap-0.5 text-sm">
          <span>{dryRun ? "Would queue" : "Queued"}</span>
          <ChunkList ids={result.chunkIds} label={chunkLabel} />
        </div>
      )}
      {result.skipped.length > 0 && (
        <div className="flex flex-col gap-0.5 text-sm">
          <span>Skipped</span>
          <ul className="flex flex-col gap-0.5">
            {result.skipped.map(({ chunkId, reason }) => (
              <li key={chunkId} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 text-xs">
                <span title={chunkId}>{chunkLabel(chunkId)}</span>
                {reason !== result.error && <span className="break-words text-muted-foreground">{reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {dryRun && result.payload && (
        <div className="flex flex-col gap-1">
          <span className="text-sm">Workflow payload</span>
          <pre className={cn("rounded-md bg-muted p-3 text-xs break-all whitespace-pre-wrap", MONO)}>
            {JSON.stringify(result.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
