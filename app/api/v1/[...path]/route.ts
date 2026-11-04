import { forwardApi } from "@/lib/api-gateway";
import { mockSocial } from "@/lib/auth-mock";

/** Development path only: deployed Workers answer /api/* in worker/entry.ts before the app router. */
async function forward(request: Request) {
  if (import.meta.env.DEV && import.meta.env.VITE_AUTH_MOCK === "1") {
    const mocked = await mockSocial(request);
    if (mocked) return mocked;
  }
  return forwardApi(request);
}
export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
