"use client";

import { PlatformIcon } from "@/components/platform-icon";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getPlatform } from "@/lib/platforms";

/** One toggle per platform in the current results; pressing the active one clears the filter. */
export function PlatformFilter({ platforms, value, onChange }: {
  platforms: string[]; value: string | null; onChange: (platform: string | null) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      aria-label="Platform"
      value={value ?? ""}
      onValueChange={(next) => onChange(next || null)}
      className="shrink-0"
    >
      {platforms.map((platform) => (
        <ToggleGroupItem key={platform} value={platform} aria-label={getPlatform(platform).name} className="h-10 px-3">
          <PlatformIcon platform={platform} decorative />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
