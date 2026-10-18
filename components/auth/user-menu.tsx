"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { initials } from "@/components/auth/user-avatar";

export function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { state, post, refresh } = useAuth();
  const router = useRouter();

  if (state.status === "disabled") return null;
  if (state.status === "loading") return <Slot><Skeleton className="size-9 rounded-full" /></Slot>;
  if (state.status === "anonymous") {
    return (
      <Slot>
        <Button asChild size="sm" onClick={onNavigate}>
          <Link href="/login">Sign in</Link>
        </Button>
      </Slot>
    );
  }

  const { identity } = state;

  async function signOut() {
    try {
      await post("/sign-out");
      await refresh();
      onNavigate?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out.");
    }
  }

  return (
    <Slot>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`Account menu for ${identity.name}`}
        >
          <Avatar className="size-8">
            {identity.image && <AvatarImage src={identity.image} alt="" />}
            <AvatarFallback>{initials(identity.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48 font-serif">
        <DropdownMenuLabel className="truncate">{identity.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account" onClick={onNavigate}>
              <UserRound />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={signOut}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
    </Slot>
  );
}

/** Fixed footprint so loading, signed-out and signed-in states never move the navbar. */
function Slot({ children }: { children: React.ReactNode }) {
  return <div className="flex h-9 w-[4.5rem] shrink-0 items-center justify-end">{children}</div>;
}
