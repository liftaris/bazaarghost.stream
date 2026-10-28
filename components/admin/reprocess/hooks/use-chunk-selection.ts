"use client";

import { useState } from "react";
import type { OpsChunk } from "@/lib/operator-contract";
import {
  pruneSelection,
  selectionCoverage,
  toggleAll,
  toggleChunk,
  type ChunkSelection,
  type SelectionCoverage,
} from "../../lib/reprocess";

/** Ticked chunks of one table and the ways to change them. */
export interface ChunkSelectionState {
  /** Only chunks still in the list that can be rerun; queued ones drop out after a refetch. */
  selected: ChunkSelection;
  coverage: SelectionCoverage;
  toggle: (chunk: OpsChunk) => void;
  toggleAll: () => void;
  clear: () => void;
}

/**
 * Bulk-rerun selection over a recording's chunks.
 * @param chunks The current rows; the selection is pruned against them on every render.
 * @returns {@link ChunkSelectionState}
 */
export function useChunkSelection(chunks: readonly OpsChunk[]): ChunkSelectionState {
  const [ticked, setTicked] = useState<ChunkSelection>(() => new Set());
  const selected = pruneSelection(ticked, chunks);
  return {
    selected,
    coverage: selectionCoverage(selected, chunks),
    toggle: (chunk) => setTicked((current) => toggleChunk(pruneSelection(current, chunks), chunk)),
    toggleAll: () => setTicked((current) => toggleAll(pruneSelection(current, chunks), chunks)),
    clear: () => setTicked(new Set()),
  };
}
