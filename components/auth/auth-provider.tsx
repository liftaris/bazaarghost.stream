"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  authClient,
  type AuthProviderId,
  type Identity,
} from "@/lib/auth-client";

export type AuthState =
  | { status: "loading" }
  | { status: "disabled" }
  | { status: "anonymous" }
  | { status: "authenticated"; identity: Identity };

interface AuthContextValue {
  state: AuthState;
  providers: AuthProviderId[];
  /** True once the provider list has been fetched (it is loaded lazily). */
  providersLoaded: boolean;
  /** Fetches the provider list once; marks auth "disabled" if the backend has it off. */
  ensureProviders: () => Promise<void>;
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

type ProviderInfo = { enabled: boolean; providers: AuthProviderId[] };

export function AuthProvider({
  children,
  initialState = null,
}: {
  children: React.ReactNode;
  /** Session resolved on the server; null when the server could not tell. */
  initialState?: Exclude<AuthState, { status: "loading" | "disabled" }> | null;
}) {
  const [state, setState] = useState<AuthState>(initialState ?? { status: "loading" });
  const [providers, setProviders] = useState<AuthProviderId[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const providersRequest = useRef<Promise<void> | null>(null);

  const readSession = useCallback(async (): Promise<AuthState> => {
    const session = await authClient.$fetch<Identity>("/session");
    return session.data
      ? { status: "authenticated", identity: session.data }
      : { status: "anonymous" };
  }, []);

  const applyProviders = useCallback((info: { data: ProviderInfo | null; error: unknown }) => {
    setProvidersLoaded(true);
    if (info.error || !info.data?.enabled) {
      setProviders([]);
      setState({ status: "disabled" });
      return false;
    }
    setProviders(info.data.providers);
    return true;
  }, []);

  const loadProviders = useCallback(
    () => authClient.$fetch<ProviderInfo>("/providers"),
    [],
  );

  const ensureProviders = useCallback(() => {
    providersRequest.current ??= loadProviders().then((info) => {
      applyProviders(info);
    });
    return providersRequest.current;
  }, [loadProviders, applyProviders]);

  const refresh = useCallback(async () => {
    const next = await readSession();
    setState((current) => (current.status === "disabled" ? current : next));
  }, [readSession]);

  useEffect(() => {
    if (initialState) return;
    providersRequest.current = null;
    const providerRequest = loadProviders();
    providersRequest.current = providerRequest.then(() => undefined);
    void Promise.all([providerRequest, readSession()]).then(([info, session]) => {
      if (applyProviders(info)) setState(session);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      providersLoaded,
      ensureProviders,
      refresh,
      signIn: (provider, callbackURL) => start("signIn", provider, callbackURL),
      linkProvider: (provider, callbackURL) => start("link", provider, callbackURL),
      post,
    }),
    [state, providers, providersLoaded, ensureProviders, refresh, start, post],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
