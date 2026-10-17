"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { Search, CalendarIcon, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { VodCard, type MergedVod } from "@/components/vod-card";
import { PaginationControls } from "@/components/pagination-controls";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

interface StreamerVodListProps {
  vods: MergedVod[];
  isAdmin?: boolean;
}

type Filter = "all" | "bazaar" | "twitch-only" | "no-ghosts";

const filters: {
  value: Filter;
  label: string;
  test: (v: MergedVod) => boolean;
}[] = [
  { value: "all", label: "All", test: () => true },
  { value: "bazaar", label: "Bazaar", test: (v) => !v.twitchOnly },
  { value: "twitch-only", label: "Not tracked", test: (v) => v.twitchOnly },
  {
    value: "no-ghosts",
    label: "No ghosts",
    test: (v) =>
      !v.twitchOnly && (v.totalDetections == null || v.totalDetections === 0),
  },
];

type VodStatus = "pending" | "processing" | "completed" | "failed" | "partial";

const statuses: { value: VodStatus; label: string; color: string }[] = [
  { value: "completed", label: "Completed", color: "bg-green-500" },
  { value: "processing", label: "Processing", color: "bg-yellow-500" },
  { value: "pending", label: "Pending", color: "bg-muted-foreground" },
  { value: "partial", label: "Partial", color: "bg-orange-400" },
  { value: "failed", label: "Failed", color: "bg-destructive" },
];

export function StreamerVodList({
  vods,
  isAdmin = false,
}: StreamerVodListProps) {
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [selectedStatus, setSelectedStatus] = useState<VodStatus | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((f) => [f.value, vods.filter(f.test).length])
      ),
    [vods]
  );

  const filtered = useMemo(() => {
    const filterFn = filters.find((f) => f.value === activeFilter)!.test;
    let result = vods.filter(filterFn);

    // Title or VOD ID search
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (v) =>
          (v.title ?? "").toLowerCase().includes(q) || v.twitchId.includes(q)
      );
    }

    // Date filter
    if (dateRange?.from) {
      if (dateRange.to) {
        // Range: inclusive of both endpoints
        const start = startOfDay(dateRange.from);
        const end = endOfDay(dateRange.to);
        result = result.filter((v) =>
          isWithinInterval(new Date(v.publishedAt), { start, end })
        );
      } else {
        // Single date selected
        result = result.filter((v) =>
          isSameDay(new Date(v.publishedAt), dateRange.from!)
        );
      }
    }

    // Status filter
    if (selectedStatus) {
      result = result.filter((v) => v.status === selectedStatus);
    }

    return result;
  }, [vods, query, dateRange, activeFilter, selectedStatus]);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, dateRange, activeFilter, selectedStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedVods = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* Search bar + date picker */}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by title or VOD ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-auto min-w-[160px] justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="size-3.5" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d")} –{" "}
                    {format(dateRange.to, "MMM d, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Filter by date"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        {dateRange?.from && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDateRange(undefined)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            title="Clear date filter"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Filter chips + timeline legend */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() =>
              setActiveFilter(activeFilter === f.value ? "all" : f.value)
            }
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {f.label}
            <span
              className={cn(
                "ml-1.5 tabular-nums",
                activeFilter === f.value
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              )}
            >
              {counts[f.value]}
            </span>
          </button>
        ))}

        {/* Status chip with popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors inline-flex items-center gap-1",
                selectedStatus
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {selectedStatus ? (
                <>
                  <span
                    className={cn(
                      "inline-block size-1.5 rounded-full",
                      statuses.find((s) => s.value === selectedStatus)?.color
                    )}
                  />
                  {statuses.find((s) => s.value === selectedStatus)?.label}
                </>
              ) : (
                "Status"
              )}
              <ChevronDown className="size-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[160px] p-1" align="start">
            <button
              onClick={() => setSelectedStatus(null)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-secondary",
                !selectedStatus && "font-medium"
              )}
            >
              <span className="size-3.5" />
              All statuses
              {!selectedStatus && <Check className="ml-auto size-3" />}
            </button>
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() =>
                  setSelectedStatus(selectedStatus === s.value ? null : s.value)
                }
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-secondary",
                  selectedStatus === s.value && "font-medium"
                )}
              >
                <span
                  className={cn("inline-block size-1.5 rounded-full", s.color)}
                />
                {s.label}
                <span className="ml-auto tabular-nums text-muted-foreground">
                  {vods.filter((v) => v.status === s.value).length}
                </span>
                {selectedStatus === s.value && (
                  <Check className="size-3 shrink-0" />
                )}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Timeline legend */}
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-1.5 w-5 rounded-full bg-accent" />
          contains gameplay of The Bazaar
        </span>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          No VODs match your filter.
        </p>
      ) : (
        <>
          <PaginationControls
            currentPage={currentPage}
            totalResults={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {paginatedVods.map((vod) => (
              <VodCard key={vod.twitchId} vod={vod} isAdmin={isAdmin} />
            ))}
          </div>
          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalResults={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
