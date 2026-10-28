"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SECTIONS } from "./constants";

function isActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/activity" && pathname.startsWith("/admin/recordings")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Console sections; vertical in the side column, a row in a wide top bar, and
 * four equal icon-over-label tabs on phones so every section stays in view.
 */
export function SectionNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Console sections">
      <ul className="grid grid-cols-4 gap-1 @lg/console:flex @3xl/console:flex-col">
        {SECTIONS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none @lg/console:flex-row @lg/console:justify-start @lg/console:gap-2 @lg/console:px-2.5 @lg/console:text-sm @lg/console:min-h-8 @lg/console:pointer-coarse:min-h-11",
                  active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon aria-hidden className={cn("size-4 shrink-0", active && "text-primary")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
