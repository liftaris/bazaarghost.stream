// LOCAL REVIEW ONLY. Not committed. Enabled with AUTH_MOCK=1 in dev.
const FRESH = 5 * 60_000;
type Store = {
  sessions: Map<string, { id: string; createdAt: number; expiresAt: number }>;
  favorites: Set<number>;
  accounts: { id: string; providerId: string; accountId: string; createdAt: string }[];
};
// Shared across module instances (route handlers and the RSC layout load separate copies in dev).
const store: Store = ((globalThis as { __authMock?: Store }).__authMock ??= {
  sessions: new Map(),
  favorites: new Set(),
  accounts: [],
});
const json = (d: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json", ...headers } });
const cookieOf = (r: Request) => /mock_session=([^;]+)/.exec(r.headers.get("cookie") ?? "")?.[1];
const setCookie = (v: string, age: number) => `mock_session=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}`;

/** Server-side session read for the mock: resolves a Cookie header to the same identity as `/session`. */
export function mockSessionFromCookie(cookie: string | null): Record<string, unknown> | null {
  const sid = /mock_session=([^;]+)/.exec(cookie ?? "")?.[1];
  const live = sid ? store.sessions.get(sid) : undefined;
  if (!live || live.expiresAt <= Date.now()) return null;
  return { userId: "mock-user", sessionId: live.id, name: "Ghost Hunter", image: null,
    createdAt: new Date(live.createdAt).toISOString(), expiresAt: new Date(live.expiresAt).toISOString(), csrfToken: `csrf-${live.id}` };
}

export async function mockAuth(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/auth", "");
  const sid = cookieOf(request);
  const session = sid ? store.sessions.get(sid) : undefined;
  const live = session && session.expiresAt > Date.now() ? session : undefined;
  const user = { name: "Ghost Hunter", image: null };

  if (path === "/providers") return json({ enabled: true, providers: ["twitch", "discord"] });

  if (path === "/mock-consent") {
    const provider = url.searchParams.get("provider")!;
    const now = Date.now();
    const id = crypto.randomUUID();
    store.sessions.set(id, { id, createdAt: now, expiresAt: now + 7 * 864e5 });
    if (!store.accounts.some((a) => a.providerId === provider))
      store.accounts.push({ id: crypto.randomUUID(), providerId: provider, accountId: String(now), createdAt: new Date(now).toISOString() });
    return new Response(null, { status: 302, headers: { location: url.searchParams.get("cb") || "/", "set-cookie": setCookie(id, 604800) } });
  }

  if (request.method === "GET") {
    if (!live) return json({ error: "Sign in required" }, 401);
    if (path === "/session")
      return json({ userId: "mock-user", sessionId: live.id, ...user, createdAt: new Date(live.createdAt).toISOString(),
        expiresAt: new Date(live.expiresAt).toISOString(), csrfToken: `csrf-${live.id}` });
    if (path === "/accounts") return json({ accounts: store.accounts });
    if (path === "/sessions")
      return json({ sessions: [...store.sessions.values()].map((s) => ({ id: s.id, createdAt: new Date(s.createdAt).toISOString(), expiresAt: new Date(s.expiresAt).toISOString() })) });
    return json({ error: "Not found" }, 404);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, string>;
  if (path === "/sign-in/social") {
    const cb = encodeURIComponent(body.callbackURL || "/");
    return json({ url: `/api/auth/mock-consent?provider=${body.provider}&cb=${cb}`, redirect: false });
  }
  if (!live) return json({ error: "Sign in required" }, 401);
  if (request.headers.get("x-csrf-token") !== `csrf-${live.id}`) return json({ error: "Invalid CSRF token" }, 403);
  const fresh = Date.now() - live.createdAt <= FRESH;
  if (path !== "/sign-out" && !fresh) return json({ error: "Recent sign in required" }, 403);

  switch (path) {
    case "/link-social": {
      const cb = encodeURIComponent(body.callbackURL || "/");
      return json({ url: `/api/auth/mock-consent?provider=${body.provider}&cb=${cb}`, redirect: false });
    }
    case "/unlink-account":
      if (store.accounts.length < 2) return json({ error: "Cannot remove the last account" }, 400);
      store.accounts = store.accounts.filter((a) => a.id !== body.accountId);
      for (const s of [...store.sessions.keys()]) if (s !== live.id) store.sessions.delete(s);
      return json({ ok: true });
    case "/revoke-session":
      store.sessions.delete(body.sessionId);
      return json({ ok: true }, 200, body.sessionId === live.id ? { "set-cookie": setCookie("", 0) } : {});
    case "/sign-out":
      store.sessions.delete(live.id);
      return json({ ok: true }, 200, { "set-cookie": setCookie("", 0) });
    case "/sign-out-all":
      store.sessions.clear();
      return json({ ok: true }, 200, { "set-cookie": setCookie("", 0) });
    case "/delete-account":
      store.sessions.clear();
      store.accounts = [];
      store.favorites.clear();
      return json({ ok: true }, 200, { "set-cookie": setCookie("", 0) });
  }
  return json({ error: "Authentication endpoint not found" }, 404);
}

/** Mock of the caller-private favorite routes; everything else goes to the real backend. */
export async function mockSocial(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname.replace("/api/v1", "");
  const list = path === "/me/favorites";
  const one = /^\/matchups\/(\d+)\/favorite$/.exec(path);
  if (!list && !one) return null;
  const sid = cookieOf(request);
  const live = sid ? store.sessions.get(sid) : undefined;
  if (!live || live.expiresAt <= Date.now()) return json({ error: "Sign in required" }, 401);
  if (list) {
    const items = [...store.favorites].sort((a, b) => a - b).map((id) => ({ matchup_id: id }));
    return json({ items, next_after: null });
  }
  if (request.headers.get("x-csrf-token") !== `csrf-${live.id}`) return json({ error: "Invalid CSRF token" }, 403);
  const id = Number(one![1]);
  await new Promise((r) => setTimeout(r, 250));
  if (request.method === "PUT") store.favorites.add(id);
  else store.favorites.delete(id);
  return json({ favorite: request.method === "PUT", matchup_id: id });
}
