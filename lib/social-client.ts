/** Caller-private social routes of the backend, reached through the `/api/v1` gateway. */
interface FavoritePage {
  items: { id: number }[];
  next_after: number | null;
}

async function failure(response: Response) {
  const body = (await response.json().catch(() => ({}))) as { error?: unknown };
  return new Error(typeof body?.error === "string" ? body.error : "Request failed");
}

/** One page of bookmarked Matchup IDs, ascending after the cursor.  */
export async function listFavoritePage(after: number, signal?: AbortSignal): Promise<FavoritePage> {
  const response = await fetch(`/api/v1/me/favorites?limit=50&after=${after}`, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw await failure(response);
  const page = (await response.json()) as { items: { matchup_id: number }[]; next_after: number | null };
  return { ...page, items: page.items.map((item) => ({ id: item.matchup_id })) };
}

export async function setFavorite(id: number, saved: boolean, csrfToken: string) {
  const response = await fetch(`/api/v1/matchups/${id}/favorite`, {
    method: saved ? "PUT" : "DELETE",
    headers: { "X-CSRF-Token": csrfToken },
    credentials: "same-origin",
  });
  if (!response.ok) throw await failure(response);
}
