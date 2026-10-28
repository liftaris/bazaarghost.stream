import { CopyId } from "@/components/copy-id";
import { cn } from "@/lib/utils";

/** An always-visible, click-to-copy id in the console's mono face. */
export function IdChip({ value, label = "Copy ID", className }: { value: string | number; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 [&_button]:max-w-full [&_button]:truncate [&_button]:font-[family-name:var(--font-jetbrains-mono)] [&_button]:text-xs [&_button]:opacity-100",
        className,
      )}
    >
      <CopyId value={String(value)} label={label} />
    </span>
  );
}
