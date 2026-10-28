"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Filters read from the URL and a setter that writes them back. */
export interface UrlFilters<F> {
  filters: F;
  /** Replace the owned keys in the URL, keeping every other parameter such as `inspect`. */
  setFilters: (next: F) => void;
}

/**
 * URL-backed filters for a console list.
 * @param parse Module-level parser from the query string; it decides what a valid value is.
 * @param keys The parameters these filters own; absent or empty values are removed from the URL.
 * @returns {@link UrlFilters}
 */
export function useUrlFilters<F extends Partial<Record<K, string>>, K extends string>(
  parse: (search: string) => F,
  keys: readonly K[],
): UrlFilters<F> {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const search = searchParams.toString();
  const filters = useMemo(() => parse(search), [parse, search]);

  const setFilters = (next: F) => {
    const params = new URLSearchParams(search);
    for (const name of keys) {
      const value = next[name];
      if (value) params.set(name, value);
      else params.delete(name);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  return { filters, setFilters };
}
