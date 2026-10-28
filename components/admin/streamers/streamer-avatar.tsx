import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { OpsStreamerRef } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";

/** A streamer's avatar, falling back to a person glyph; decorative because the name sits beside it. */
export function StreamerAvatar({ streamer, className }: { streamer: OpsStreamerRef; className?: string }) {
  return (
    <Avatar className={cn("size-7 shrink-0", className)}>
      {streamer.avatarUrl && <AvatarImage src={streamer.avatarUrl} alt="" />}
      <AvatarFallback className="bg-muted text-muted-foreground">
        <User aria-hidden className="size-3.5" />
      </AvatarFallback>
    </Avatar>
  );
}
