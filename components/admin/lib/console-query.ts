const CLIENT_PARAMS = new Set(["inspect", "status", "chunkStatus", "platform", "q", "kind", "show"]);

export function isConsoleQuery(current: URL, next: URL): boolean {
  if (
    current.origin !== next.origin || current.pathname !== next.pathname || current.hash !== next.hash ||
    !(current.pathname === "/admin" || current.pathname.startsWith("/admin/"))
  ) return false;
  const keys = new Set([...current.searchParams.keys(), ...next.searchParams.keys()]);
  return [...keys].every((key) =>
    CLIENT_PARAMS.has(key) || JSON.stringify(current.searchParams.getAll(key)) === JSON.stringify(next.searchParams.getAll(key)),
  );
}

export function updateConsoleQuery(href: string, mode: "push" | "replace"): boolean {
  const current = new URL(window.location.href);
  const next = new URL(href, current);
  if (!isConsoleQuery(current, next)) return false;
  window.history[mode === "push" && next.href !== current.href ? "pushState" : "replaceState"](null, "", next);
  return true;
}
