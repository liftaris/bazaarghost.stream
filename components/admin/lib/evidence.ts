import type { EvidenceField, FieldEvidence } from "@/lib/api-contract";

/** A box positioned in percent of the frame it sits on, so it stays aligned at any rendered size. */
export interface PercentBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * How to show only a region of a frame: a container with the region's aspect
 * ratio, holding the full image sized and offset in percent of that container.
 */
export interface CropFrame {
  /** Region width over height, for the container's `aspect-ratio`. */
  aspectRatio: number;
  /** Image width in percent of the container. */
  width: number;
  /** Image offsets in percent of the container's width and height. */
  left: number;
  top: number;
}

/** The parts of a read that place its region on the frame. */
export type RegionSource = Pick<FieldEvidence, "region" | "sourceWidth" | "sourceHeight">;

/** One field's evidence. */
export interface FieldRead {
  field: EvidenceField;
  evidence: FieldEvidence;
}

/** Reads that came from one stored frame, such as IGD and wins left from the clock frame. */
export interface FrameGroup {
  /** Frame hash, else image URL, else the lone field when the read has no image. */
  key: string;
  screenshotUrl: string | null;
  atMs: number;
  reads: FieldRead[];
}

/** The region clipped to its frame in source pixels, or null when it is unknown or empty. */
function clippedRegion({ region, sourceWidth, sourceHeight }: RegionSource) {
  if (!region || !sourceWidth || !sourceHeight || sourceWidth <= 0 || sourceHeight <= 0) return null;
  const [x, y, w, h] = region;
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(sourceWidth, x + w);
  const y1 = Math.min(sourceHeight, y + h);
  if (x1 <= x0 || y1 <= y0) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, sourceWidth, sourceHeight };
}

/** Place a source-pixel region on its frame in percent. */
export function regionBox(source: RegionSource): PercentBox | null {
  const r = clippedRegion(source);
  if (!r) return null;
  return {
    left: (r.x / r.sourceWidth) * 100,
    top: (r.y / r.sourceHeight) * 100,
    width: (r.w / r.sourceWidth) * 100,
    height: (r.h / r.sourceHeight) * 100,
  };
}

/** Size and offset the full frame so a region-shaped container shows only that region. */
export function cropFrame(source: RegionSource): CropFrame | null {
  const r = clippedRegion(source);
  if (!r) return null;
  return {
    aspectRatio: r.w / r.h,
    width: (r.sourceWidth / r.w) * 100,
    left: -(r.x / r.w) * 100,
    top: -(r.y / r.h) * 100,
  };
}

/**
 * Group reads by the frame they came from, earliest frame first. Fields keep
 * `order` within a group, and that order also breaks ties between frames.
 */
export function groupByFrame(
  fieldEvidence: Partial<Record<EvidenceField, FieldEvidence>>,
  order: readonly EvidenceField[],
): FrameGroup[] {
  const groups = new Map<string, FrameGroup>();
  for (const field of order) {
    const evidence = fieldEvidence[field];
    if (!evidence) continue;
    const key = evidence.frameSha256 ?? evidence.screenshotUrl ?? `field:${field}`;
    const group = groups.get(key);
    if (group) group.reads.push({ field, evidence });
    else groups.set(key, { key, screenshotUrl: evidence.screenshotUrl, atMs: evidence.atMs, reads: [{ field, evidence }] });
  }
  return [...groups.values()].sort((a, b) => a.atMs - b.atMs);
}
