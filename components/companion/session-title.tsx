"use client";

import { useEffect, useRef } from "react";

export function SessionTitle({ title }: { title: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    const text = textRef.current;
    if (!heading || !text) return;
    const measure = () => {
      const overflow = Math.max(0, text.scrollWidth - heading.clientWidth);
      heading.dataset.overflow = String(overflow > 0);
      heading.style.setProperty("--marquee-distance", `${-overflow}px`);
      heading.style.setProperty(
        "--marquee-duration",
        `${Math.max(4, overflow / 30)}s`
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(heading);
    observer.observe(text);
    measure();
    return () => observer.disconnect();
  }, [title]);

  return (
    <h2
      ref={headingRef}
      id="companion-heading"
      tabIndex={-1}
      title={title}
      className="session-title min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span ref={textRef} className="inline-block whitespace-nowrap">
        {title}
      </span>
    </h2>
  );
}
