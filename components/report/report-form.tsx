"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";
import {
  REPORT_CATEGORIES,
  REPORT_MESSAGE_MAX,
  type ReportCategory,
} from "@/lib/reports";
import type { ReportSnapshot } from "./hooks/use-report-snapshot";

/** Category chips, an optional note and a send button. Posts the snapshot taken when the dialog opened. */
export function ReportForm({
  snapshot,
  onSent,
}: {
  snapshot: ReportSnapshot;
  onSent: () => void;
}) {
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsMessage = category === "other" && !message.trim();

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!category || needsMessage || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, ...snapshot }),
      });
      if (!response.ok) throw new Error();
      toast.success("Report sent. Thank you!");
      onSent();
    } catch {
      setError("Couldn't send the report. Try again in a moment.");
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <ToggleGroup
        type="single"
        value={category}
        onValueChange={(v) => setCategory(v as ReportCategory | "")}
        aria-label="What's wrong?"
        className="flex w-full flex-wrap justify-start gap-2"
      >
        {Object.entries(REPORT_CATEGORIES).map(([value, label]) => (
          <ToggleGroupItem
            key={value}
            value={value}
            variant="outline"
            size="sm"
            className="rounded-full! border px-3 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
        }}
        maxLength={REPORT_MESSAGE_MAX}
        rows={3}
        aria-label="Details"
        placeholder={
          category === "other"
            ? "What's wrong?"
            : "Details (optional), e.g. the correct name"
        }
        className="min-h-20 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={!category || needsMessage || sending}
        className="self-end"
      >
        {sending && <Spinner />}
        Send report
      </Button>
    </form>
  );
}
