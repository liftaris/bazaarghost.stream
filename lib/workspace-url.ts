/** Supported left workspaces; never infer one from a display name or unknown URL value. */
export type ListMode = "ghosts" | "streamers" | "recordings" | "saved";

/** Valid explicit list state wins; legacy clean resource URLs retain their historical default. */
export function listMode(pathname: string, value: string | null): ListMode {
  if (
    value === "ghosts" ||
    value === "streamers" ||
    value === "recordings" ||
    value === "saved"
  )
    return value;
  return /^\/streamers(\/|$)/.test(pathname)
    ? "streamers"
    : /^\/recordings(\/|$)/.test(pathname)
      ? "recordings"
      : /^\/saved(\/|$)/.test(pathname)
        ? "saved"
        : "ghosts";
}

/** List-only params; source pins and context selection are not search intent. */
export const LIST_PARAMS = [
  "list",
  "q",
  "platform",
  "xplatform",
  "from",
  "to",
  "streamer",
  "channel",
] as const;

/** Carry left state onto a resource URL, including a validated mode and any explicit source pin. */
export function resourceHref(
  path: string,
  pathname: string,
  search: string
): string {
  const live = new URLSearchParams(search);
  const target = new URL(path, "https://workspace.invalid");
  const out = new URLSearchParams();
  for (const key of LIST_PARAMS)
    if (live.get(key)) out.set(key, live.get(key)!);
  out.set("list", listMode(pathname, live.get("list")));
  for (const [key, value] of target.searchParams) out.set(key, value);
  return `${target.pathname}${out.size ? `?${out}` : ""}`;
}
