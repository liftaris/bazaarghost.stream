/** Which entity the `?inspect=` URL parameter opens in the side inspector. */
export type InspectTarget = { kind: "chunk"; id: string } | { kind: "detection"; id: string };

/** Query parameter that carries the inspector target across every console page. */
export const INSPECT_PARAM = "inspect";

/** Parse `chunk:<id>` or `detection:<id>`; anything else means the inspector is closed. */
export function parseInspect(value: string | null | undefined): InspectTarget | null {
  const match = /^(chunk|detection):(.+)$/.exec(value?.trim() ?? "");
  if (!match) return null;
  return { kind: match[1] as InspectTarget["kind"], id: match[2] };
}

/** Serialize a target to its `?inspect=` value. */
export function formatInspect(target: InspectTarget): string {
  return `${target.kind}:${target.id}`;
}

/** Return `?query` with the inspector set or cleared, keeping every other parameter. */
export function withInspect(search: string | URLSearchParams, target: InspectTarget | null): string {
  const params = new URLSearchParams(search);
  if (target) params.set(INSPECT_PARAM, formatInspect(target));
  else params.delete(INSPECT_PARAM);
  const query = params.toString();
  return query ? `?${query}` : "";
}
