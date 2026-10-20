import { CirclePlay } from "lucide-react";
import type { SimpleIcon } from "simple-icons";
import { getPlatform } from "@/lib/platforms";
import { cn } from "@/lib/utils";

type SvgProps = Omit<React.ComponentProps<"svg">, "children">;

/** A simple-icons mark in currentColor. Named via `title`, otherwise decorative. */
export function BrandIcon({
  icon,
  title,
  className,
  ...props
}: { icon: Pick<SimpleIcon, "path">; title?: string } & SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("size-4 shrink-0", className)}
      {...props}
    >
      <path d={icon.path} />
    </svg>
  );
}

/**
 * Platform mark from the registry; unknown platforms get a generic icon.
 * Pass `decorative` when the platform name is already visible next to it.
 * `brand` paints it in the platform's own colour instead of currentColor.
 */
export function PlatformIcon({
  platform,
  decorative,
  brand,
  className,
  style,
  ...props
}: { platform: string; decorative?: boolean; brand?: boolean } & SvgProps) {
  const def = getPlatform(platform);
  const title = decorative ? undefined : def.name;
  const color = brand && def.mark?.hex ? { color: `#${def.mark.hex}`, ...style } : style;
  if (!def.mark) {
    return (
      <CirclePlay
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
        className={cn("size-4 shrink-0", className)}
        style={color}
        {...(props as object)}
      />
    );
  }
  return <BrandIcon icon={def.mark} title={title} className={className} style={color} {...props} />;
}
