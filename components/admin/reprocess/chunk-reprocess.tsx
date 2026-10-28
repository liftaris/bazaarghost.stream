import type { OpsChunkDetail } from "@/lib/operator-contract";
import { chunkLabeller, configBlock, REPROCESS_BLOCK } from "../lib/reprocess";
import { ReprocessPanel } from "./reprocess-panel";
import { RerunFacts } from "./rerun-facts";

/** The rerun form for the chunk in the inspector, starting from its `runDefaults`. */
export function ChunkReprocess({ detail }: { detail: OpsChunkDetail }) {
  const { chunk, recording, detections, runDefaults } = detail;
  return (
    <ReprocessPanel
      title="Rerun this chunk"
      chunkIds={[chunk.id]}
      defaults={runDefaults}
      blocked={REPROCESS_BLOCK[chunk.status] ?? configBlock(runDefaults)}
      chunkLabel={chunkLabeller([chunk])}
      facts={<RerunFacts runtimeImage={runDefaults.inputs.runtime_image} recording={recording} detections={detections.length} />}
    />
  );
}
