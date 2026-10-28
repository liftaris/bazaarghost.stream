import { ApiError } from "./api-client";
import type { OpsMutations, OpsQueries, OpsRoutes } from "./operator-contract";

/** Options for {@link opsGet}: `id` is required exactly when the route template has `:id`. */
export type OpsGetOptions<P extends keyof OpsRoutes> = (P extends `${string}:id${string}`
  ? { id: string | number }
  : { id?: never }) & {
  params?: P extends keyof OpsQueries ? OpsQueries[P] : never;
};

/**
 * A refused operator write. `body` keeps the route's response when the server sent one with the
 * failure, as `/reprocess` does on 409 and 502 with per-recording results; otherwise it is null.
 */
export class OpsMutationError<T> extends ApiError {
  constructor(
    status: number,
    message: string,
    readonly body: T | null,
  ) {
    super(status, message);
  }
}

/** Normalize any thrown value to an {@link ApiError}; network failures get status 0. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, error instanceof Error ? error.message : "Could not reach the console API");
}

const errorText = (body: unknown, status: number) =>
  body && typeof body === "object" && "error" in body && typeof body.error === "string"
    ? body.error
    : `Request failed with status ${status}`;

/** Typed operator read through the same-origin gateway; failures throw {@link ApiError}. */
export async function opsGet<P extends keyof OpsRoutes>(
  path: P,
  options: OpsGetOptions<P>,
  signal?: AbortSignal,
): Promise<OpsRoutes[P]> {
  const route = options.id === undefined ? path : path.replace(":id", encodeURIComponent(String(options.id)));
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options.params ?? {}))
    if (value != null && value !== "") query.set(key, String(value));
  const response = await fetch(`/api/v1/ops${route}${query.size ? `?${query}` : ""}`, {
    signal,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new ApiError(response.status, errorText(body, response.status));
  }
  return response.json();
}

/** Typed operator write with the session's CSRF token; refusals throw {@link OpsMutationError}. */
export async function opsPost<P extends keyof OpsMutations>(
  path: P,
  body: OpsMutations[P]["request"],
  csrfToken: string,
): Promise<OpsMutations[P]["response"]> {
  const response = await fetch(`/api/v1/ops${path}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    body: JSON.stringify(body),
  });
  if (response.ok) return response.json();
  const parsed: unknown = await response.json().catch(() => null);
  const withResult = parsed && typeof parsed === "object" && Object.keys(parsed).some((key) => key !== "error");
  const kept = withResult ? (parsed as OpsMutations[P]["response"]) : null;
  throw new OpsMutationError(response.status, errorText(parsed, response.status), kept);
}
