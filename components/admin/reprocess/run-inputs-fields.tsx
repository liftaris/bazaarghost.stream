"use client";

import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { OperatorRunInputs, ProcessorMode } from "@/lib/operator-contract";
import { MODE_LABEL, QUALITY_LABEL, RUN_QUALITIES } from "../lib/reprocess";

const LABEL = "text-xs font-medium text-muted-foreground";

/** Mode as a segmented control over the modes this environment allows, and quality as a select. */
export function RunInputsFields({
  value,
  allowedModes,
  disabled,
  onChange,
}: {
  value: OperatorRunInputs;
  allowedModes: readonly ProcessorMode[];
  disabled: boolean;
  onChange: (next: OperatorRunInputs) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
      <div role="group" aria-labelledby={`${id}-mode`} className="flex flex-col gap-1.5">
        <span id={`${id}-mode`} className={LABEL}>
          Mode
        </span>
        <ToggleGroup
          type="single"
          size="sm"
          className="rounded-md border border-border p-0.5"
          value={value.mode}
          disabled={disabled}
          aria-labelledby={`${id}-mode`}
          onValueChange={(next: string) => {
            const mode = allowedModes.find((allowed) => allowed === next);
            if (mode) onChange({ ...value, mode });
          }}
        >
          {allowedModes.map((mode) => (
            <ToggleGroupItem
              key={mode}
              value={mode}
              className="h-7 rounded-sm! px-3 text-muted-foreground hover:text-foreground data-[state=on]:bg-primary/15 data-[state=on]:text-foreground"
            >
              {MODE_LABEL[mode]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {allowedModes.length === 1 && (
          <span className="text-xs text-muted-foreground">Only {MODE_LABEL[allowedModes[0]]} runs in this environment.</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-quality`} className={LABEL}>
          Quality
        </label>
        <Select
          value={value.quality}
          disabled={disabled}
          onValueChange={(next) => {
            const quality = RUN_QUALITIES.find((known) => known === next);
            if (quality) onChange({ ...value, quality });
          }}
        >
          <SelectTrigger id={`${id}-quality`} size="sm" className="w-36 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RUN_QUALITIES.map((quality) => (
              <SelectItem key={quality} value={quality}>
                {QUALITY_LABEL[quality]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
