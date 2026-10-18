"use client";

import { ChevronRight } from "lucide-react";
import type { SearchMode as SearchType } from "@/components/search/types";

export interface BreadcrumbSegment {
  label: string;
  type: SearchType;
  filterId?: string;
}

interface SearchBreadcrumbProps {
  segments: BreadcrumbSegment[];
  onNavigate: (index: number) => void;
}

export function SearchBreadcrumb({
  segments,
  onNavigate,
}: SearchBreadcrumbProps) {
  if (segments.length <= 1) return null;

  return (
    <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3" />}
            {isLast ? (
              <span className="font-medium text-foreground">{seg.label}</span>
            ) : (
              <button
                onClick={() => onNavigate(i)}
                className="hover:text-foreground transition-colors"
              >
                {seg.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
