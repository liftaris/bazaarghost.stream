import { formatDateTime, formatRelative, MISSING } from "./lib/format";

/** A time read as "5 minutes ago", with the absolute time on hover; the placeholder when absent. */
export function RelativeTime({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-muted-foreground">{MISSING}</span>;
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className="whitespace-nowrap">
      {formatRelative(iso)}
    </time>
  );
}
