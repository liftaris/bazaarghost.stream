import { backendFetch } from "@/lib/backend-server";
import { mockAuth } from "@/lib/auth-mock";

/** Better Auth remains in the backend; preserve browser origin and Set-Cookie headers. */
async function forward(request: Request) {
  if (import.meta.env.DEV && import.meta.env.VITE_AUTH_MOCK === "1") return mockAuth(request);
  return backendFetch(request);
}
export { forward as GET, forward as POST, forward as DELETE };
