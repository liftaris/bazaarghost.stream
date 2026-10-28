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

/** Console sections; vertical in the side column, a scrollable row in the top bar. */
export function SectionNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Console sections" className={className}>
      <ul className="flex gap-1 @3xl/console:flex-col">
        {SECTIONS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-md px-2.5 text-sm whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none",
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
