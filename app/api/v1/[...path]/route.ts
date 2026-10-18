import { backendFetch } from "@/lib/backend-server";

/** Same-origin gateway. No administrative credentials or arbitrary upstream URLs. */
async function forward(request: Request) {
  const response = await backendFetch(request);
  const headers = new Headers(response.headers);
  // Visibility and session checks must run on every request, including cache revalidation.
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}
export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
