"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONO } from "../constants";
import type { CropFrame } from "../lib/evidence";

const BOX = "relative w-full overflow-hidden rounded-lg border border-border bg-muted";

/** Why a frame cannot be drawn: nothing was stored, or the stored image did not load. */
type Missing = "none" | "failed";

function MissingFrame({ missing, url, compact }: { missing: Missing; url: string | null; compact?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center text-muted-foreground">
      <ImageOff aria-hidden className={compact ? "size-4" : "size-5"} />
      {!compact && (
        <>
          <p className="text-sm font-medium text-foreground">
            {missing === "none" ? "No image was stored for this read" : "This frame did not load"}
          </p>
          {missing === "failed" && url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "max-w-full truncate text-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring",
                MONO,
              )}
            >
              {url}
            </a>
          )}
        </>
      )}
      {compact && <span className="sr-only">{missing === "none" ? "No image" : "Image did not load"}</span>}
    </div>
  );
}

/** Remember which URL failed so a new URL gets a fresh attempt without remounting. */
function useFailedUrl(url: string | null) {
  const [failed, setFailed] = useState<string | null>(null);
  return { failed: url !== null && failed === url, onError: () => setFailed(url) };
}

/** Props for {@link FrameImage}. */
export interface FrameImageProps {
  url: string | null;
  alt: string;
  /** Source width over height; overlays are drawn only when it is known. */
  aspectRatio: number | null;
  /** Percent-positioned overlays, such as region outlines. */
  children?: ReactNode;
  /** Thumbnail mode: icon-only missing state and lazy loading. */
  compact?: boolean;
  className?: string;
}

/**
 * A stored frame at its source aspect ratio, with overlays on top and a clear
 * state when the image is missing or fails to load.
 */
export function FrameImage({ url, alt, aspectRatio, children, compact, className }: FrameImageProps) {
  const { failed, onError } = useFailedUrl(url);
  return (
    <div className={cn(BOX, className)} style={{ aspectRatio: aspectRatio ?? 16 / 9 }}>
      {url === null || failed ? (
        <MissingFrame missing={url === null ? "none" : "failed"} url={url} compact={compact} />
      ) : (
        <>
          <Image
            src={url}
            alt={alt}
            fill
            unoptimized
            loading={compact ? "lazy" : "eager"}
            onError={onError}
            style={{ objectFit: aspectRatio ? "fill" : "contain" }}
          />
          {aspectRatio && children}
        </>
      )}
    </div>
  );
}

/** Props for {@link CroppedFrame}. */
export interface CroppedFrameProps {
  url: string | null;
  alt: string;
  crop: CropFrame;
}

/** Only the region of a frame, scaled up to fill a box no taller than 16rem. */
export function CroppedFrame({ url, alt, crop }: CroppedFrameProps) {
  const { failed, onError } = useFailedUrl(url);
  const box: CSSProperties = { aspectRatio: crop.aspectRatio, width: `min(100%, ${16 * crop.aspectRatio}rem)` };
  return (
    <div className={cn(BOX, "mx-auto", (url === null || failed) && "min-h-32")} style={box}>
      {url === null || failed ? (
        <MissingFrame missing={url === null ? "none" : "failed"} url={url} />
      ) : (
        <Image
          src={url}
          alt={alt}
          fill
          unoptimized
          onError={onError}
          style={{ inset: "auto", height: "auto", maxWidth: "none", width: `${crop.width}%`, left: `${crop.left}%`, top: `${crop.top}%` }}
        />
      )}
    </div>
  );
}
