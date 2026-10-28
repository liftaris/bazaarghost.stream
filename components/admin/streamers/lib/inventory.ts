import type { InventoryItem, InventoryState, StatusCounts } from "@/lib/operator-contract";

/** A filter chip over a channel's inventory; every state belongs to exactly one group. */
export type InventoryGroup = "not_seen" | "skipped" | "scanned" | "attention" | "processed";

/** The inventory filter in the URL: one group, or every row. */
export type InventoryFilter = InventoryGroup | "all";

/** Which chip owns each state, so the group counts always add up to the total. */
export const INVENTORY_GROUP: Record<InventoryState, InventoryGroup> = {
  not_seen: "not_seen",
  skipped: "skipped",
  waiting: "scanned",
  cataloged: "scanned",
  processing: "scanned",
  partial: "attention",
  failed: "attention",
  processed: "processed",
};

/** Filter chips in reading order, from never seen to done. */
export const INVENTORY_FILTERS: readonly { value: InventoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "not_seen", label: "Not scanned" },
  { value: "skipped", label: "Skipped" },
  { value: "scanned", label: "Scanned, not processed" },
  { value: "attention", label: "Partial or failed" },
  { value: "processed", label: "Processed" },
];

/** Inventory states in reading order, for summaries. */
export const INVENTORY_STATES: readonly InventoryState[] = [
  "not_seen",
  "skipped",
  "waiting",
  "cataloged",
  "processing",
  "partial",
  "failed",
  "processed",
];

const isGroup = (value: string): value is InventoryGroup => Object.values(INVENTORY_GROUP).includes(value as InventoryGroup);

/** Read the `show` parameter; unknown values mean every row. */
export function parseInventoryFilter(search: string | URLSearchParams): { show?: InventoryGroup } {
  const show = new URLSearchParams(search).get("show") ?? "";
  return isGroup(show) ? { show } : {};
}

/** Whether an inventory row belongs under a filter chip. */
export function matchesInventoryFilter(item: Pick<InventoryItem, "state">, filter: InventoryFilter): boolean {
  return filter === "all" || INVENTORY_GROUP[item.state] === filter;
}

/** Rows per state; states with no rows are 0. */
export function countInventoryStates(items: readonly Pick<InventoryItem, "state">[]): StatusCounts<InventoryState> {
  const counts = Object.fromEntries(INVENTORY_STATES.map((state) => [state, 0])) as StatusCounts<InventoryState>;
  for (const item of items) counts[item.state] += 1;
  return counts;
}

/** Rows under each filter chip, `all` included. */
export function countInventoryFilters(items: readonly Pick<InventoryItem, "state">[]): Record<InventoryFilter, number> {
  const counts: Record<InventoryFilter, number> = { all: items.length, not_seen: 0, skipped: 0, scanned: 0, attention: 0, processed: 0 };
  for (const item of items) counts[INVENTORY_GROUP[item.state]] += 1;
  return counts;
}
