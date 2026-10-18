"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authClient,
  type AuthProviderId,
  type Identity,
} from "@/lib/auth-client";

type AuthState =
  | { status: "loading" }
  | { status: "disabled" }
  | { status: "anonymous" }
  | { status: "authenticated"; identity: Identity };

interface AuthContextValue {
  state: AuthState;
  providers: AuthProviderId[];
  refresh: () => Promise<void>;
  /** Starts the provider's OAuth flow. Resolves only if the redirect could not start. */
  signIn: (provider: AuthProviderId, callbackURL: string) => Promise<void>;
  linkProvider: (provider: AuthProviderId, callbackURL: string) => Promise<void>;
  /** Signed-in JSON POST to an `/api/auth` route, with the session-bound CSRF token. */
  post: (path: string, body?: Record<string, unknown>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export class AuthActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function describe(error: { status: number; message?: string; error?: unknown }) {
  const text = typeof error.error === "string" ? error.error : error.message;
  return new AuthActionError(text || "Something went wrong. Try again.", error.status);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const [providers, setProviders] = useState<AuthProviderId[]>([]);

  const refresh = useCallback(async () => {
    const info = await authClient.$fetch<{
      enabled: boolean;
      providers: AuthProviderId[];
    }>("/providers");
    if (info.error || !info.data?.enabled) {
      setProviders([]);
      setState({ status: "disabled" });
      return;
    }
    setProviders(info.data.providers);
    const session = await authClient.$fetch<Identity>("/session");
    setState(
      session.data
        ? { status: "authenticated", identity: session.data }
        : { status: "anonymous" },
    );
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const csrf = state.status === "authenticated" ? state.identity.csrfToken : "";

  const start = useCallback(
    async (kind: "signIn" | "link", provider: AuthProviderId, callbackURL: string) => {
      const result =
        kind === "signIn"
          ? await authClient.signIn.social({ provider, callbackURL })
          : await authClient.linkSocial({
              provider,
              callbackURL,
              fetchOptions: { headers: { "X-CSRF-Token": csrf } },
            });
      if (result.error) throw describe(result.error);
      const url = result.data?.url;
      if (!url) throw new AuthActionError("Unable to start sign in.", 502);
      window.location.assign(url);
    },
    [csrf],
  );

  const post = useCallback(
    async (path: string, body: Record<string, unknown> = {}) => {
      const { error } = await authClient.$fetch(path, {
        method: "POST",
        body,
        headers: { "X-CSRF-Token": csrf },
      });
      if (error) throw describe(error);
    },
    [csrf],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      providers,
      refresh,
      signIn: (provider, callbackURL) => start("signIn", provider, callbackURL),
      linkProvider: (provider, callbackURL) => start("link", provider, callbackURL),
      post,
    }),
    [state, providers, refresh, start, post],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
