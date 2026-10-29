import Image from "next/image";
import type { Hero } from "@/lib/api-contract";
import { heroLabel } from "@/lib/session-summary";
import { cn } from "@/lib/utils";

export function HeroIcon({
  hero,
  className,
}: {
  hero: Hero | null | undefined;
  className?: string;
}) {
  const label = heroLabel(hero);
  const classes = cn(
    "inline-flex size-6 shrink-0 items-center justify-center object-contain text-sm font-semibold text-hero-muted",
    className
  );

  return label === "-" ? (
    <span
      role="img"
      aria-label="Unknown hero"
      title="Unknown hero"
      className={classes}
    >
      ?
    </span>
  ) : (
    <Image
      src={`/heroes/${hero}.webp`}
      alt={label}
      title={label}
      width={24}
      height={24}
      unoptimized
      className={classes}
    />
  );
}
