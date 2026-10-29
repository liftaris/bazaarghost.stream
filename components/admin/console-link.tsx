"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { updateConsoleQuery } from "./lib/console-query";

export default function ConsoleLink({
  href,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
          (event.currentTarget.target && event.currentTarget.target !== "_self") || event.currentTarget.hasAttribute("download")
        ) return;
        if (updateConsoleQuery(event.currentTarget.href, props.replace ? "replace" : "push")) event.preventDefault();
      }}
    />
  );
}
