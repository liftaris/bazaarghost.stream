"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { getImageProps } from "next/image";

import { cn } from "@/lib/utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  const { src, alt, width, height, ...rest } = props;

  // Fallback to original behavior if no src or src is not a string
  if (!src || typeof src !== "string") {
    return (
      <AvatarPrimitive.Image
        data-slot="avatar-image"
        className={cn("aspect-square size-full", className)}
        {...props}
      />
    );
  }

  // Use fixed size for avatars to reduce transformations
  // Default to 40px which is the common avatar size (size-10 = 2.5rem = 40px)
  // For size-12, that's 3rem = 48px
  const avatarSize = width && height ? Number(width) : 48; // Default to 48px for size-12 avatars

  // Use Next.js image optimization
  const { props: nextOptimizedProps } = getImageProps({
    src,
    // Bilibili's avatar CDN rejects cross-site Referer headers.
    referrerPolicy: "no-referrer",
    alt: alt || "",
    width: avatarSize,
    height: avatarSize,
    sizes: `${avatarSize}px`,
    quality: 75,
    ...rest,
  });

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...nextOptimizedProps}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
