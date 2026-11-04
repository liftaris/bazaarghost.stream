"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const platforms = ["YouTube", "BiliBili", "Twitch"];

/** Cycle the indexed platforms in place; every word shares one grid cell so the line never reflows. */
export function RotatingPlatform() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % platforms.length),
      2500
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <span className="sr-only">YouTube, BiliBili, and Twitch</span>
      <span aria-hidden className="inline-grid justify-items-center">
        {platforms.map((platform, i) => (
          <span
            key={platform}
            className={cn(
              "col-start-1 row-start-1 transition-[opacity,filter] duration-200 ease-out",
              i === index
                ? "opacity-100 blur-[0px] delay-150"
                : "opacity-0 blur-sm"
            )}
          >
            {platform}
          </span>
        ))}
      </span>
    </>
  );
}
