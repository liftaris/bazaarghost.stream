import { env } from "cloudflare:workers";

/** Public accounts: sign in, account page, saved matchups and bookmarks. Off means launch without users. */
export async function isSocialEnabled(): Promise<boolean> {
  if (import.meta.env.DEV && import.meta.env.VITE_SOCIAL === "1") return true;
  try {
    return await env.FLAGS.getBooleanValue("social-auth", false);
  } catch {
    return false;
  }
}
