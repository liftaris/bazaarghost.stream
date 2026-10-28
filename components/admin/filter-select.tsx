"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ANY = "any";

/** One option of a {@link FilterSelect}. */
export interface FilterOption<V extends string> {
  value: V;
  label: string;
}

/** A compact select whose first option clears the filter. */
export function FilterSelect<V extends string>({
  label,
  anyLabel,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  anyLabel: string;
  value: V | undefined;
  options: readonly FilterOption<V>[];
  onChange: (value: V | undefined) => void;
  className?: string;
}) {
  return (
    <Select value={value ?? ANY} onValueChange={(next) => onChange(next === ANY ? undefined : (next as V))}>
      <SelectTrigger size="sm" aria-label={label} className={cn("w-40", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{anyLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
