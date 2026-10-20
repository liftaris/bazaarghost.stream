import type { MatchupResult, Page } from "./api-contract";

/** Caller-private social routes of the backend, reached through the `/api/v1` gateway. */
async function failure(response: Response) {
  const body = (await response.json().catch(() => ({}))) as { error?: unknown };
  return new Error(typeof body?.error === "string" ? body.error : "Request failed");
}

/** One page of saved Matchups as full cards, newest saved first. */
export async function listFavoritePage(cursor?: string | null, signal?: AbortSignal): Promise<Page<MatchupResult>> {
  const query = new URLSearchParams({ limit: "50" });
  if (cursor) query.set("cursor", cursor);
  const response = await fetch(`/api/v1/me/favorites?${query}`, { credentials: "same-origin", cache: "no-store", signal });
  if (!response.ok) throw await failure(response);
  return response.json();
}

export async function setFavorite(id: number, saved: boolean, csrfToken: string) {
  const response = await fetch(`/api/v1/matchups/${id}/favorite`, {
    method: saved ? "PUT" : "DELETE",
    headers: { "X-CSRF-Token": csrfToken },
    credentials: "same-origin",
  });
  if (!response.ok) throw await failure(response);
}
