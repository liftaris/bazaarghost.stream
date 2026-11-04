import { env } from "cloudflare:workers";

/** Server-only service binding. The backend owns data, sessions and authorization. */
export async function backendFetch(request: Request): Promise<Response> {
  const started = performance.now();
  const response = await env.BACKEND.fetch(request.url, {
    method: request.method, headers: Object.fromEntries(request.headers),
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
    signal: request.signal,
  });
  const result = new Response(response.body, response);
  result.headers.append("Server-Timing", `binding;dur=${(performance.now() - started).toFixed(1)}`);
  return result;
}
