import { backendFetch } from "@/lib/backend-server";
import { mockSocial } from "@/lib/auth-mock";

const PUBLIC_READS = new Set(["matchups", "stats", "search", "streamers", "recordings"]);
const SESSION_COOKIE = /(?:^|;\s*)(?:bazaarghost_session|__Host-bazaarghost_session|mock_session)=/;

/** Same-origin gateway. No administrative credentials or arbitrary upstream URLs. */
async function forward(request: Request) {
  if (import.meta.env.DEV && import.meta.env.VITE_AUTH_MOCK === "1") {
    const mocked = await mockSocial(request);
    if (mocked) return mocked;
  }
  const response = await backendFetch(request);
  const headers = new Headers(response.headers);
  const url = new URL(request.url);
  const publicRead = (request.method === "GET" || request.method === "HEAD")
    && PUBLIC_READS.has(url.pathname.split("/")[3] ?? "")
    && !SESSION_COOKIE.test(request.headers.get("cookie") ?? "")
    && !headers.has("Set-Cookie");
  if (publicRead) headers.append("Vary", "Cookie");
  else headers.set("Cache-Control", "private, no-store"); // Visibility and session checks must run on every request.
  return new Response(response.body, { status: response.status, headers });
}
export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
