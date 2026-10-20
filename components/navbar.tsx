"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { SavedLink } from "@/components/social/saved-link";
import { siDiscord } from "simple-icons";
import { BrandIcon } from "@/components/platform-icon";
import { Heart, Moon, Sun, Menu } from "lucide-react";
import { showSearchTabs } from "@/flags";
import { useState, useSyncExternalStore } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const subscribeNever = () => () => {};

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="border-b border-border bg-card font-serif">
      <div className="mx-auto max-w-6xl px-4 py-1">
        <div className="flex items-center justify-between">
          {/* Logo - clicking returns to home and clears filters */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo.svg"
              alt="Logo"
              width={40}
              height={25}
              unoptimized
              priority
              className="object-contain"
            />
            <h1 className="text-xl font-bold text-primary">BazaarGhost</h1>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/search"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Search
            </Link>
            {showSearchTabs && (
              <Link
                href="/streamers"
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                Streamers
              </Link>
            )}
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Desktop Actions - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-foreground hover:text-primary"
            >
              <Link href="/donate" aria-label="Donate">
                <Heart className="size-5" />
              </Link>
            </Button>
            {/* Discord Button */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-foreground hover:text-primary"
            >
              <a
                href="https://discord.gg/a5wRFRe6m3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join Discord"
              >
                <BrandIcon icon={siDiscord} className="size-5" />
              </a>
            </Button>

            <SavedLink />
            <UserMenu />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="text-foreground hover:text-primary"
            >
              {!mounted ? (
                // Render nothing or a placeholder during SSR
                <div className="size-5" />
              ) : theme === "dark" ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
            </Button>
          </div>

          {/* Mobile Menu - Visible only on mobile */}
          <div className="flex items-center md:hidden">
          <SavedLink />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Toggle Menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] font-serif">
              <SheetHeader>
                <SheetTitle className="text-left font-serif">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4">
                {/* Mobile Navigation Links */}
                <Link
                  href="/search"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  Search
                </Link>
                {showSearchTabs && (
                  <Link
                    href="/streamers"
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
                  >
                    Streamers
                  </Link>
                )}
                <Link
                  href="/how-it-works"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  How It Works
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  Contact
                </Link>

                {/* Divider */}
                <div className="my-2 border-t border-border" />

                {/* Mobile Actions */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-foreground hover:text-primary"
                  >
                    <Link href="/donate" aria-label="Donate" onClick={() => setIsOpen(false)}>
                      <Heart className="size-5" />
                    </Link>
                  </Button>
                  {/* Discord Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-foreground hover:text-primary"
                  >
                    <a
                      href="https://discord.gg/a5wRFRe6m3"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Join Discord"
                    >
                      <BrandIcon icon={siDiscord} className="size-5" />
                    </a>
                  </Button>

                  <UserMenu onNavigate={() => setIsOpen(false)} />

                  {/* Theme Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="text-foreground hover:text-primary"
                  >
                    {!mounted ? (
                      // Render nothing or a placeholder during SSR
                      <div className="size-5" />
                    ) : theme === "dark" ? (
                      <Sun className="size-5" />
                    ) : (
                      <Moon className="size-5" />
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
