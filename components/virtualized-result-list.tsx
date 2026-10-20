"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fixed row height (72px card + 8px gap) */
const ROW_HEIGHT = 72;
const ROW_GAP = 8;
const ITEM_SIZE = ROW_HEIGHT + ROW_GAP;

/** Height for date separator rows (compact — sits close to the row below) */
const DATE_HEADER_HEIGHT = 24;

/** Height for the "other matches" divider */
const SEPARATOR_HEIGHT = 32;

/** How far from the bottom (in px) to trigger fetching the next batch */
const LOAD_MORE_PX = 400;

/** After the user last touched the list, a followed item does not scroll it for this long */
const USER_SCROLL_GRACE_MS = 4000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VirtualEntry<T> =
  | { type: "date"; date: string; label: string }
  | { type: "separator"; label: string; lines: boolean }
  | { type: "item"; item: T; originalIndex: number };

/** Index + label of each stickable header in the entries array */
interface HeaderMeta {
  index: number;
  label: string;
}

interface VirtualizedResultListProps<T> {
  /** The accumulated items array */
  items: T[];
  /** Total count from the server (used for result count display) */
  totalCount: number;
  /** Unique key extractor */
  getItemKey: (item: T) => string | number;
  /** Render a single row. The item and its index are provided. */
  renderItem: (item: T, index: number) => ReactNode;
  /** Called when the user scrolls near the bottom and more items are available */
  onLoadMore: () => void;
  /** Whether a fetch is currently in progress */
  isLoadingMore: boolean;
  /** Whether there are more items to fetch */
  hasMore: boolean;
  /** Overscan count — number of rows to render outside the visible area */
  overscan?: number;
  /**
   * Extract an ISO date string from an item for day-grouping.
   * When provided, date separator rows are inserted between groups.
   */
  getItemDate?: (item: T) => string;
  /**
   * Extract the string to test for prefix-matching against `searchQuery`.
   * When both this and `searchQuery` are provided, items are partitioned
   * into prefix matches (with date headers) and "other matches" (no dates).
   */
  getItemMatchField?: (item: T) => string;
  /** Current search query — used together with getItemMatchField. */
  searchQuery?: string;
  /** A newer query is pending: blur/fade the current rows until they are replaced. */
  stale?: boolean;
  /** Key of the highlighted item; it is scrolled into view when it changes, unless the user is scrolling. */
  activeKey?: string | number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO date string as a relative or absolute day label. */
function formatDayLabel(dateKey: string): string {
  // dateKey is "YYYY-MM-DD"
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  if (dateKey === today) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";

  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Build a flat entry array. When a searchQuery + getItemMatchField are given
 * the items are partitioned into prefix-matches (with date headers) then an
 * "other matches" separator followed by the remaining fuzzy matches (no dates).
 * Without a searchQuery, all items get date headers.
 */
function buildGroupedEntries<T>(
  items: T[],
  getItemDate: (item: T) => string,
  searchQuery?: string,
  getItemMatchField?: (item: T) => string
): VirtualEntry<T>[] {
  const q = searchQuery?.trim().toLowerCase();
  const hasQuery = !!q && !!getItemMatchField;

  // Partition when we have a query
  let prefixItems: { item: T; originalIndex: number }[] = [];
  const otherItems: { item: T; originalIndex: number }[] = [];

  if (hasQuery) {
    for (let i = 0; i < items.length; i++) {
      const field = getItemMatchField(items[i]).toLowerCase();
      if (field.startsWith(q!)) {
        prefixItems.push({ item: items[i], originalIndex: i });
      } else {
        otherItems.push({ item: items[i], originalIndex: i });
      }
    }
  } else {
    // No query — everything is "prefix" (gets date headers)
    prefixItems = items.map((item, i) => ({ item, originalIndex: i }));
  }

  const entries: VirtualEntry<T>[] = [];
  const seenDates = new Set<string>();

  // --- Prefix matches: with date headers ---
  for (const { item, originalIndex } of prefixItems) {
    const dateKey = (getItemDate(item) ?? "").slice(0, 10);
    if (!seenDates.has(dateKey)) {
      entries.push({
        type: "date",
        date: dateKey,
        label: formatDayLabel(dateKey),
      });
      seenDates.add(dateKey);
    }
    entries.push({ type: "item", item, originalIndex });
  }

  // --- "no exact matches" when query produced zero prefix hits ---
  if (hasQuery && prefixItems.length === 0 && otherItems.length > 0) {
    entries.push({
      type: "separator",
      label: "no exact matches",
      lines: false,
    });
  }

  // --- "other matches" separator + remaining items (no date headers) ---
  if (otherItems.length > 0) {
    entries.push({ type: "separator", label: "other matches", lines: true });
    for (const { item, originalIndex } of otherItems) {
      entries.push({ type: "item", item, originalIndex });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Date header content (no lines — just the label)
// ---------------------------------------------------------------------------

function DateHeaderContent({ label }: { label: string }) {
  return (
    <span className="shrink-0 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Separator content (with lines)
// ---------------------------------------------------------------------------

function SeparatorContent({ label }: { label: string }) {
  return (
    <>
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VirtualizedResultList<T>({
  items,
  getItemKey,
  renderItem,
  onLoadMore,
  isLoadingMore,
  hasMore,
  overscan = 5,
  getItemDate,
  getItemMatchField,
  searchQuery,
  stale = false,
  activeKey = null,
}: VirtualizedResultListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastInteraction = useRef(0);
  // Ref-based guard prevents duplicate fetches between scroll events
  // (React state updates are async, so isLoadingMore can be stale in the handler)
  const loadingRef = useRef(false);
  loadingRef.current = isLoadingMore;

  // Build grouped entries (with date/separator headers) when getItemDate is provided
  const entries = useMemo<VirtualEntry<T>[]>(() => {
    if (!getItemDate) {
      return items.map((item, i) => ({
        type: "item" as const,
        item,
        originalIndex: i,
      }));
    }
    return buildGroupedEntries(
      items,
      getItemDate,
      searchQuery,
      getItemMatchField
    );
  }, [items, getItemDate, searchQuery, getItemMatchField]);

  // Pre-compute indices of stickable headers (date + separator) for sticky logic
  const headerMetas = useMemo<HeaderMeta[]>(() => {
    const metas: HeaderMeta[] = [];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (e.type === "date" || e.type === "separator") {
        metas.push({ index: i, label: e.label });
      }
    }
    return metas;
  }, [entries]);

  // TanStack Virtual returns non-memoizable functions; the list opts out of the compiler here
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const entry = entries[index];
      if (!entry || entry.type === "item") return ITEM_SIZE;
      return entry.type === "date" ? DATE_HEADER_HEIGHT : SEPARATOR_HEIGHT;
    },
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Follow the highlighted item, but never fight a user who is scrolling the list
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const touch = () => { lastInteraction.current = Date.now(); };
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    events.forEach((name) => el.addEventListener(name, touch, { passive: true }));
    return () => events.forEach((name) => el.removeEventListener(name, touch));
  }, []);
  useEffect(() => {
    if (activeKey === null || Date.now() - lastInteraction.current < USER_SCROLL_GRACE_MS) return;
    const index = entries.findIndex((e) => e.type === "item" && getItemKey(e.item) === activeKey);
    if (index < 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    virtualizer.scrollToIndex(index, { align: "auto", behavior: reduced ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a change of the highlighted item scrolls
  }, [activeKey]);

  // ---- Sticky header state ----
  // Track which header is stuck, its type, and an optional upward offset
  // when the next header pushes it out.
  const [stickyLabel, setStickyLabel] = useState<string | null>(null);
  const [stickyType, setStickyType] = useState<"date" | "separator">("date");
  const [stickyLines, setStickyLines] = useState(false);
  const [stickyOffset, setStickyOffset] = useState(0);
  const [stickyIndex, setStickyIndex] = useState(-1);

  const updateSticky = useCallback(() => {
    if (headerMetas.length === 0) return;

    const scrollTop = scrollRef.current?.scrollTop ?? 0;

    // Walk header metas backwards to find the last header we scrolled past.
    let currentIdx = -1;
    for (let i = headerMetas.length - 1; i >= 0; i--) {
      const offset = virtualizer.getOffsetForIndex(
        headerMetas[i].index,
        "start"
      );
      const headerStart = offset?.[0] ?? 0;
      if (scrollTop > headerStart) {
        currentIdx = i;
        break;
      }
    }

    if (currentIdx === -1) {
      setStickyLabel(null);
      setStickyOffset(0);
      setStickyIndex(-1);
      return;
    }

    const meta = headerMetas[currentIdx];
    const stuckEntry = entries[meta.index];
    const stuckType =
      stuckEntry.type === "date" || stuckEntry.type === "separator"
        ? stuckEntry.type
        : "date";
    const stuckHeight =
      stuckType === "date" ? DATE_HEADER_HEIGHT : SEPARATOR_HEIGHT;

    setStickyLabel(meta.label);
    setStickyType(stuckType);
    setStickyLines(stuckEntry.type === "separator" && stuckEntry.lines);
    setStickyIndex(meta.index);

    // Check if the next header is close enough to push the stuck one up
    const nextMeta = headerMetas[currentIdx + 1];
    if (nextMeta) {
      const nextOffset = virtualizer.getOffsetForIndex(nextMeta.index, "start");
      const nextStart = nextOffset?.[0] ?? 0;
      const distFromTop = nextStart - scrollTop;
      if (distFromTop < stuckHeight) {
        setStickyOffset(distFromTop - stuckHeight);
      } else {
        setStickyOffset(0);
      }
    } else {
      setStickyOffset(0);
    }
  }, [headerMetas, entries, virtualizer]);

  // Infinite scroll + sticky: listen for scroll events on our own container
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el && hasMore && !loadingRef.current) {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom < LOAD_MORE_PX) {
        loadingRef.current = true;
        onLoadMore();
      }
    }
    updateSticky();
  }, [hasMore, onLoadMore, updateSticky]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  // Load more when content doesn't fill the viewport (no scroll events fire)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      // A hidden list (workspace hidden on content routes) has no viewport to fill.
      if (!hasMore || loadingRef.current || el.clientHeight === 0) return;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_PX) {
        loadingRef.current = true;
        onLoadMore();
      }
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length, hasMore, isLoadingMore, onLoadMore]);

  // Re-calculate sticky when entries change (e.g. new batch loaded)
  useEffect(() => {
    updateSticky();
  }, [entries, updateSticky]);

  if (items.length === 0) return null;

  const totalSize = virtualizer.getTotalSize();
  const hasHeaders = headerMetas.length > 0;
  const stickyHeight =
    stickyType === "date" ? DATE_HEADER_HEIGHT : SEPARATOR_HEIGHT;

  return (
    <div
      aria-busy={stale}
      className={cn(
        "flex min-h-0 flex-1 flex-col transition-[opacity,filter] duration-150 ease-out motion-reduce:transition-opacity",
        stale && "pointer-events-none opacity-50 blur-[2px] motion-reduce:blur-none"
      )}
    >
      {/* Scroll container wrapper — relative so the sticky overlay is positioned to it */}
      <div className="relative min-h-0 flex-1">
        {/* Sticky header overlay */}
        {hasHeaders && stickyLabel && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 overflow-hidden pl-4 pr-2"
            style={{ height: `${stickyHeight}px` }}
          >
            <div
              className="flex h-full w-full items-center gap-3 bg-background pr-2"
              style={{
                transform: stickyOffset
                  ? `translateY(${stickyOffset}px)`
                  : undefined,
              }}
            >
              {stickyType === "separator" && stickyLines ? (
                <SeparatorContent label={stickyLabel} />
              ) : (
                <DateHeaderContent label={stickyLabel} />
              )}
            </div>
          </div>
        )}

        {/* Scrollable virtual list — pr-2 leaves gutter for scrollbar */}
        <div ref={scrollRef} className="h-full overflow-y-auto pl-4 pr-2">
          <div className="relative w-full" style={{ height: `${totalSize}px` }}>
            {virtualItems.map((virtualRow) => {
              const entry = entries[virtualRow.index];
              if (!entry) return null;

              // Date header
              if (entry.type === "date") {
                const isStuck = virtualRow.index === stickyIndex;
                return (
                  <div
                    key={`date-${entry.date}`}
                    className="absolute left-0 top-0 flex w-full items-end pr-2"
                    style={{
                      height: `${DATE_HEADER_HEIGHT}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      visibility: isStuck ? "hidden" : undefined,
                    }}
                  >
                    <DateHeaderContent label={entry.label} />
                  </div>
                );
              }

              // "other matches" separator
              if (entry.type === "separator") {
                const isStuck = virtualRow.index === stickyIndex;
                return (
                  <div
                    key={`sep-${entry.label}`}
                    className="absolute left-0 top-0 flex w-full items-center gap-3 pr-2"
                    style={{
                      height: `${SEPARATOR_HEIGHT}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      visibility: isStuck ? "hidden" : undefined,
                    }}
                  >
                    {entry.lines ? (
                      <SeparatorContent label={entry.label} />
                    ) : (
                      <DateHeaderContent label={entry.label} />
                    )}
                  </div>
                );
              }

              // Result row
              return (
                <div
                  key={getItemKey(entry.item)}
                  className="absolute left-0 top-0 w-full pr-2"
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {renderItem(entry.item, entry.originalIndex)}
                </div>
              );
            })}
          </div>

          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Breathing room under the last row */}
          {!hasMore && <div aria-hidden className="h-4" />}
        </div>
      </div>
    </div>
  );
}
