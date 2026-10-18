import { backendFetch } from "@/lib/backend-server";

/** Better Auth remains in the backend; preserve browser origin and Set-Cookie headers. */
async function forward(request: Request) {
  return backendFetch(request);
}
export { forward as GET, forward as POST, forward as DELETE };
