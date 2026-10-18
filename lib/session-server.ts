import { headers } from "next/headers";
import type { Identity } from "@/lib/auth-client";
import { backendFetch } from "@/lib/backend-server";
import { mockSessionFromCookie } from "@/lib/auth-mock";

/** `unknown` means the server could not tell; the client then resolves it itself. */
export type ServerSession =
  | { status: "authenticated"; identity: Identity }
  | { status: "anonymous" }
  | { status: "unknown" };

const MOCK = import.meta.env.DEV && import.meta.env.VITE_AUTH_MOCK === "1";

/** Reads the caller's session from the backend with the incoming Cookie header. Never throws. */
export async function getServerSession(): Promise<ServerSession> {
  try {
    const incoming = await headers();
    const cookie = incoming.get("cookie");
    if (MOCK) {
      const identity = mockSessionFromCookie(cookie) as Identity | null;
      return identity ? { status: "authenticated", identity } : { status: "anonymous" };
    }
    if (!cookie || !/(?:^|;\s*)(?:__Host-)?bazaarghost_session=/.test(cookie)) return { status: "anonymous" };
    const host = incoming.get("x-forwarded-host") ?? incoming.get("host");
    if (!host) return { status: "unknown" };
    const proto = incoming.get("x-forwarded-proto") ?? "https";
    const response = await backendFetch(
      new Request(`${proto}://${host}/api/auth/session`, {
        headers: { cookie, accept: "application/json" },
        signal: AbortSignal.timeout(1500),
      }),
    );
    if (response.status === 401) return { status: "anonymous" };
    if (!response.ok) return { status: "unknown" };
    const identity = (await response.json()) as Identity;
    return identity?.userId ? { status: "authenticated", identity } : { status: "unknown" };
  } catch {
    return { status: "unknown" };
  }
}
