import { backendFetch } from "@/lib/backend-server";

const PUBLIC_READS = new Set(["matchups", "stats", "search", "streamers", "recordings", "sessions", "platforms", "channels"]);
const SESSION_COOKIE = /(?:^|;\s*)(?:bazaarghost_session|__Host-bazaarghost_session|mock_session)=/;
/** The backend keys its public cache on these but never varies a response by them. */
const CACHE_KEY_HEADERS = ["accept", "range", "prefer"];

/** Same-origin gateway. No administrative credentials or arbitrary upstream URLs. */
export async function forwardApi(request: Request) {
  const url = new URL(request.url);
  const read = (request.method === "GET" || request.method === "HEAD")
    && PUBLIC_READS.has(url.pathname.split("/")[3] ?? "");
  const response = await backendFetch(read ? withoutCacheKeyHeaders(request) : request);
  const headers = new Headers(response.headers);
  const publicRead = read
    && !SESSION_COOKIE.test(request.headers.get("cookie") ?? "")
    && !headers.has("Set-Cookie");
  if (publicRead) headers.append("Vary", "Cookie");
  else headers.set("Cache-Control", "private, no-store"); // Visibility and session checks must run on every request.
  return new Response(response.body, { status: response.status, headers });
}

function withoutCacheKeyHeaders(request: Request) {
  const headers = new Headers(request.headers);
  for (const name of CACHE_KEY_HEADERS) headers.delete(name);
  return new Request(request.url, { method: request.method, headers, signal: request.signal });
}
