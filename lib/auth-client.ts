import { createAuthClient } from "better-auth/client";

/**
 * Better Auth runs in the backend and is reached through the `/api/auth` gateway.
 * The backend only exposes social sign-in plus its own `/session`, `/accounts` and
 * `/sessions` reads, so those go through the client's `$fetch` rather than `useSession`.
 */
export const authClient = createAuthClient({ basePath: "/api/auth" });

export type AuthProviderId = "discord" | "twitch";

export interface Identity {
  userId: string;
  sessionId: string;
  name: string;
  image: string | null;
  createdAt: string;
  expiresAt: string;
  csrfToken: string;
}

export interface LinkedAccount {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  createdAt: string;
  expiresAt: string;
}

/** Backend requires a login from the last five minutes for sensitive changes. */
export const FRESH_MS = 5 * 60 * 1000;

export function isFresh(identity: Pick<Identity, "createdAt">, now = Date.now()) {
  return now - new Date(identity.createdAt).getTime() <= FRESH_MS;
}

/** Only same-origin paths may be used as a post-login destination. */
export function safeNext(value: string | null | undefined, fallback = "/account") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
