/** A closed range in recording seconds. */
export interface Span {
  start: number;
  end: number;
}

/** Horizontal placement on the timeline, in percent of its width. */
export interface Placement {
  left: number;
  width: number;
}

/** Pair the flat `[start, end, start, end, ...]` chapter list, dropping empty or inverted pairs. */
export function chapterSpans(flat: readonly number[]): Span[] {
  const spans: Span[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2)
    if (flat[i + 1] > flat[i]) spans.push({ start: flat[i], end: flat[i + 1] });
  return spans.sort((a, b) => a.start - b.start);
}

/** Seconds the timeline spans: the recording duration, stretched to cover any later span. */
export function timelineExtent(durationSeconds: number | null, spans: readonly Span[]): number {
  return Math.max(durationSeconds ?? 0, ...spans.map((span) => span.end), 0);
}

/** Place a span; tiny spans keep a visible minimum width without running past the end. */
export function placeSpan(span: Span, extent: number, minPercent = 0.4): Placement {
  if (extent <= 0) return { left: 0, width: 0 };
  const start = Math.min(Math.max(span.start, 0), extent);
  const end = Math.min(Math.max(span.end, start), extent);
  const width = Math.min(Math.max(((end - start) / extent) * 100, minPercent), 100);
  return { left: Math.min((start / extent) * 100, 100 - width), width };
}

/** Percent position of an instant, clamped to the timeline. */
export function placeTick(at: number, extent: number): number {
  if (extent <= 0) return 0;
  return Math.min(Math.max((at / extent) * 100, 0), 100);
}

/** Evenly spaced axis positions in seconds, from 0 to the extent inclusive. */
export function axisMarks(extent: number, divisions = 4): number[] {
  if (extent <= 0) return [0];
  return Array.from({ length: divisions + 1 }, (_, i) => (extent * i) / divisions);
}
