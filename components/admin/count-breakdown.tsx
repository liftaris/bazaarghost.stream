import { cn } from "@/lib/utils";
import { STATUS, type Status } from "./constants";

/**
 * Non-zero status counts in the order given. Compact rows show icon and number
 * with the label on hover; `labelled` spells the label out.
 */
export function CountBreakdown<S extends Status>({
  counts,
  order,
  labelled,
  className,
}: {
  counts: Record<S, number>;
  order: readonly S[];
  labelled?: boolean;
  className?: string;
}) {
  const shown = order.filter((status) => counts[status] > 0);
  if (!shown.length) return <span className={cn("text-xs text-muted-foreground", className)}>None</span>;
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums", className)}>
      {shown.map((status) => {
        const { label, icon: Icon, text } = STATUS[status];
        return (
          <li key={status} title={label} className={cn("inline-flex items-center gap-1 whitespace-nowrap", text)}>
            <Icon aria-hidden className="size-3.5 shrink-0" />
            <span className={labelled ? undefined : "sr-only"}>{label}{labelled ? " " : ": "}</span>
            <span className={labelled ? "font-medium text-foreground" : undefined}>{counts[status].toLocaleString("en-US")}</span>
          </li>
        );
      })}
    </ul>
  );
}
