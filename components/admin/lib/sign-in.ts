/** Sign-in page that returns to `pathname?search` afterwards, keeping slashes readable. */
export function signInHref(pathname: string, search: string): string {
  const here = `${pathname}${search ? `?${search}` : ""}`;
  return `/login?next=${encodeURIComponent(here).replaceAll("%2F", "/")}`;
}
