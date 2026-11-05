import app from "vinext/server/fetch-handler";
import { forwardApi } from "@/lib/api-gateway";
import { backendFetch } from "@/lib/backend-server";
import { handleReport } from "@/lib/reports-server";

export * from "vinext/server/fetch-handler";

/** API calls go straight to the backend binding; the app router (and its route caches) only see pages. */
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/reports") return handleReport(request);
    if (pathname.startsWith("/api/v1/")) return forwardApi(request);
    if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return backendFetch(request);
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
