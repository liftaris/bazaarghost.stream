import { ApiError } from "./api-client";
import type { OpsQueries, OpsRoutes } from "./operator-contract";

/** Options for {@link opsGet}: `id` is required exactly when the route template has `:id`. */
export type OpsGetOptions<P extends keyof OpsRoutes> = (P extends `${string}:id${string}`
  ? { id: string | number }
  : { id?: never }) & {
  params?: P extends keyof OpsQueries ? OpsQueries[P] : never;
};

/** Normalize any thrown value to an {@link ApiError}; network failures get status 0. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, error instanceof Error ? error.message : "Could not reach the console API");
}

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
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }
  return response.json();
}
