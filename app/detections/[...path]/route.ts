import { backendFetch } from "@/lib/backend-server";

/** Stream screenshots through the backend's current publication/visibility check. */
async function forward(request: Request) {
  return backendFetch(request);
}
export { forward as GET, forward as HEAD };
