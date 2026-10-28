/** URL-backed search of the streamer list. */
export interface StreamerSearch {
  q?: string;
}

/** Read the streamer search from the URL, dropping a blank query. */
export function parseStreamerSearch(search: string | URLSearchParams): StreamerSearch {
  const q = new URLSearchParams(search).get("q")?.trim();
  return q ? { q } : {};
}
