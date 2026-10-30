import { env } from "cloudflare:workers";

/** Server-only service binding. The backend owns data, sessions and authorization. */
export function backendFetch(request: Request): Promise<Response> {
  return env.BACKEND.fetch(request.url, {
    method: request.method, headers: Object.fromEntries(request.headers),
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
    signal: request.signal,
  });
}
