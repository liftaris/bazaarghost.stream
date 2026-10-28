"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { INSPECT_PARAM, parseInspect, withInspect, type InspectTarget } from "../lib/inspect";

/** The URL-driven inspector: what it shows, links that open it, and closing it. */
export interface InspectParam {
  target: InspectTarget | null;
  /** Current page with the inspector pointed at `target`, for links and blocks. */
  hrefFor: (target: InspectTarget) => string;
  close: () => void;
}

/**
 * Read and write `?inspect=` without touching other query parameters.
 * @returns {@link InspectParam}
 */
export function useInspectParam(): InspectParam {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();
  const target = parseInspect(searchParams.get(INSPECT_PARAM));

  const hrefFor = useCallback((next: InspectTarget) => `${pathname}${withInspect(search, next)}`, [pathname, search]);
  const close = useCallback(
    () => router.replace(`${pathname}${withInspect(search, null)}`, { scroll: false }),
    [router, pathname, search],
  );

  return { target, hrefFor, close };
}
