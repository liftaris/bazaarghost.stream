/** Routes that render their own content instead of the search/player workspace. */
const CONTENT_ROUTES = ["/login", "/account", "/how-it-works", "/contact", "/donate", "/admin"];

export function isWorkspacePath(pathname: string) {
  return pathname !== "/" && !CONTENT_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
