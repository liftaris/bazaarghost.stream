import app from "vinext/server/fetch-handler";
import { forwardApi } from "@/lib/api-gateway";
import { backendFetch } from "@/lib/backend-server";
import { handleReport } from "@/lib/reports-server";
import { INDEXABLE, SITE_URL } from "@/lib/site";

export * from "vinext/server/fetch-handler";

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Content-Security-Policy": "frame-ancestors 'none'",
  "X-Frame-Options": "DENY",
};

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  if (url.hostname === "www.bazaarghost.stream")
    return Response.redirect(`${SITE_URL}${url.pathname}${url.search}`, 301);
  const { pathname } = url;
  if (pathname === "/api/reports") return handleReport(request);
  if (pathname.startsWith("/api/v1/")) return forwardApi(request);
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return backendFetch(request);
  return app.fetch(request, env, ctx);
}

/** API calls go straight to the backend binding; the app router (and its route caches) only see pages. */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const response = await route(request, env, ctx);
    if (response.status === 101) return response;
    const secured = new Response(response.body, response);
    for (const [name, value] of Object.entries(SECURITY_HEADERS))
      if (!secured.headers.has(name)) secured.headers.set(name, value);
    if (!INDEXABLE) secured.headers.set("X-Robots-Tag", "noindex, nofollow");
    return secured;
  },
} satisfies ExportedHandler<Env>;
