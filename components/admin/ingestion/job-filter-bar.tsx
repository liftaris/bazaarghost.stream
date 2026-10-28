"use client";

import { listPlatforms } from "@/lib/platforms/registry";
import { STATUS } from "../constants";
import { FilterSelect } from "../filter-select";
import { JOB_KINDS, JOB_STATUSES, type JobFilters } from "./lib/job-filters";

const KIND_OPTIONS = JOB_KINDS.map((kind) => ({ value: kind, label: kind[0].toUpperCase() + kind.slice(1) }));
const STATUS_OPTIONS = JOB_STATUSES.map((status) => ({ value: status, label: STATUS[status].label }));

/** Platform, kind and status filters for the ingestion jobs; every change goes to the URL. */
export function JobFilterBar({ filters, onChange }: { filters: JobFilters; onChange: (next: JobFilters) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        label="Platform"
        anyLabel="Any platform"
        value={filters.platform}
        options={listPlatforms().map((platform) => ({ value: platform.id, label: platform.name }))}
        onChange={(platform) => onChange({ ...filters, platform })}
        className="w-36"
      />
      <FilterSelect
        label="Kind"
        anyLabel="Any kind"
        value={filters.kind}
        options={KIND_OPTIONS}
        onChange={(kind) => onChange({ ...filters, kind })}
        className="w-36"
      />
      <FilterSelect
        label="Status"
        anyLabel="Any status"
        value={filters.status}
        options={STATUS_OPTIONS}
        onChange={(status) => onChange({ ...filters, status })}
        className="w-36"
      />
    </div>
  );
}
