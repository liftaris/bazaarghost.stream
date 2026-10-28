"use client";

import { listPlatforms } from "@/lib/platforms/registry";
import { STATUS } from "../constants";
import { FilterSelect } from "../filter-select";
import { ACTIVITY_STATUSES, type ActivityFilters } from "../lib/activity-filters";
import { SearchField } from "../search-field";

const STATUS_OPTIONS = ACTIVITY_STATUSES.map((status) => ({
  value: status,
  label: status === "attention" ? "Needs attention" : STATUS[status].label,
}));

/** Status, platform and text filters for the activity list; every change goes to the URL. */
export function FilterBar({ filters, onChange }: { filters: ActivityFilters; onChange: (next: ActivityFilters) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        label="Status"
        anyLabel="Any status"
        value={filters.status}
        options={STATUS_OPTIONS}
        onChange={(status) => onChange({ ...filters, status })}
        className="w-44"
      />
      <FilterSelect
        label="Platform"
        anyLabel="Any platform"
        value={filters.platform}
        options={listPlatforms().map((platform) => ({ value: platform.id, label: platform.name }))}
        onChange={(platform) => onChange({ ...filters, platform })}
        className="w-36"
      />
      <SearchField
        value={filters.q}
        onSearch={(q) => onChange({ ...filters, q })}
        label="Search recordings by title, streamer or source id"
        placeholder="Title, streamer or source id"
      />
    </div>
  );
}
