"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore, type Ref } from "react";
import { Heart, Moon, Sun, Menu } from "lucide-react";
import { siDiscord } from "simple-icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/auth/user-menu";
import { SavedLink } from "@/components/social/saved-link";
import { BrandIcon } from "@/components/platform-icon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const subscribeNever = () => () => {};

export default function Navbar({
  searchRef,
  workspace,
}: {
  searchRef: Ref<HTMLDivElement>;
  workspace: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      aria-label="Main navigation"
      className="shrink-0 border-b border-border bg-card pt-[env(safe-area-inset-top)]"
    >
      <div className="@container/nav mx-auto w-full max-w-6xl">
        <div
          className={cn(
            "grid items-center gap-x-3 gap-y-2 px-3 py-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]",
            workspace
              ? "grid-cols-[auto_1fr_auto] @xl/nav:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
              : "grid-cols-[1fr_auto] py-4 @xl/nav:grid-cols-[1fr_auto_auto]"
          )}
        >
          <Link
            href="/"
            aria-label="BazaarGhost home"
            className="flex w-fit shrink-0 items-center gap-3 rounded-sm font-serif transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11 pointer-coarse:min-w-11"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={40}
              height={25}
              unoptimized
              priority
              className="object-contain"
            />
            <span
              className={cn(
                "text-xl font-bold text-primary",
                workspace && "hidden @5xl/nav:inline"
              )}
            >
              BazaarGhost
            </span>
          </Link>
          {!workspace && (
            <div className="hidden items-center gap-7 px-4 font-serif text-sm text-muted-foreground @xl/nav:flex">
              <Link
                href="/search"
                className="rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                Search
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                How it works
              </Link>
              <Link
                href="/contact"
                className="rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                Contact
              </Link>
            </div>
          )}
          <div ref={searchRef} className={workspace ? "contents" : "hidden"} />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className={cn(
                  "justify-self-end pointer-coarse:size-11",
                  workspace && "col-start-3 row-start-1 @xl/nav:col-start-4"
                )}
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 font-serif pr-[env(safe-area-inset-right)]"
            >
              <SheetHeader className="shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-coarse:[&_button]:min-h-11 pointer-coarse:[&_button]:min-w-11 pointer-coarse:[&_a]:min-h-11 pointer-coarse:[&_a]:min-w-11">
                {[
                  ["/search", "Search"],
                  ["/how-it-works", "How It Works"],
                  ["/contact", "Contact"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className="flex shrink-0 items-center rounded-sm py-1 text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                ))}
                <Separator />
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href="/donate"
                      aria-label="Donate"
                      onClick={() => setIsOpen(false)}
                    >
                      <Heart />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href="https://discord.gg/a5wRFRe6m3"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Join Discord"
                    >
                      <BrandIcon icon={siDiscord} />
                    </a>
                  </Button>
                  <SavedLink onNavigate={() => setIsOpen(false)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    }
                    aria-label="Toggle theme"
                  >
                    {mounted ? (
                      resolvedTheme === "dark" ? (
                        <Sun />
                      ) : (
                        <Moon />
                      )
                    ) : null}
                  </Button>
                </div>
                <UserMenu onNavigate={() => setIsOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
