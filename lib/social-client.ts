/** Caller-private social routes of the backend, reached through the `/api/v1` gateway. */
interface FavoritePage {
  items: { id: number }[];
  next_after: number | null;
}

async function failure(response: Response) {
  const body = (await response.json().catch(() => ({}))) as { error?: unknown };
  return new Error(typeof body?.error === "string" ? body.error : "Request failed");
}

/** One page of bookmarked clip IDs, ascending after the cursor. Clip IDs are matchup IDs. */
export async function listFavoritePage(after: number, signal?: AbortSignal): Promise<FavoritePage> {
  const response = await fetch(`/api/v1/me/favorites?limit=50&after=${after}`, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw await failure(response);
  return (await response.json()) as FavoritePage;
}

export async function setFavorite(id: number, saved: boolean, csrfToken: string) {
  const response = await fetch(`/api/v1/clips/${id}/favorite`, {
    method: saved ? "PUT" : "DELETE",
    headers: { "X-CSRF-Token": csrfToken },
    credentials: "same-origin",
  });
  if (!response.ok) throw await failure(response);
}
