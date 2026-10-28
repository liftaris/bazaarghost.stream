"use client";

import { ExternalLink } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { MONO } from "../constants";
import type { RunRequester, Viewer } from "../lib/runs";

/** The signed-in operator, so their own runs read by name. */
export function useViewer(): Viewer | null {
  const { state } = useAuth();
  return state.status === "authenticated" ? { userId: state.identity.userId, name: state.identity.name } : null;
}

/** Link to a run's GitHub Actions page, or nothing when the runner has not reported one. */
export function GithubRunLink({ url, className }: { url: string | null; className?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs whitespace-nowrap underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
    >
      GitHub run
      <ExternalLink aria-hidden className="size-3" />
    </a>
  );
}

/** Who asked for a run; another operator shows as their user id in mono. */
export function RunOrigin({ requester }: { requester: RunRequester }) {
  return (
    <span className="min-w-0">
      {requester.label}
      {requester.userId && (
        <>
          {" · "}
          <span className={cn("text-xs break-all", MONO)}>{requester.userId}</span>
        </>
      )}
    </span>
  );
}
