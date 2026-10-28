import type { FieldEvidence } from "@/lib/api-contract";
import { cn } from "@/lib/utils";
import { MONO } from "../constants";
import { formatTimecode } from "../lib/format";
import { FrameImage } from "./frame-image";

type Sample = NonNullable<FieldEvidence["samples"]>[number];

function Thumb({
  url,
  label,
  time,
  pressed,
  onClick,
}: {
  url: string | null;
  label: string;
  time: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <li className="shrink-0">
      <button
        type="button"
        aria-pressed={pressed}
        aria-label={`${label} at ${time}`}
        onClick={onClick}
        className={cn(
          "flex w-[5.25rem] flex-col gap-1 rounded-md p-1 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
          pressed && "bg-muted",
        )}
      >
        <FrameImage
          url={url}
          alt=""
          aspectRatio={16 / 9}
          compact
          className={cn("rounded-[5px]", pressed && "border-primary ring-1 ring-primary")}
        />
        <span className="flex flex-col text-[11px] leading-tight text-muted-foreground">
          <span className={cn("truncate", pressed && "font-medium text-foreground")}>{label}</span>
          <span className={cn("tabular-nums", MONO)}>{time}</span>
        </span>
      </button>
    </li>
  );
}

/** Props for {@link SamplesStrip}. */
export interface SamplesStripProps {
  evidence: FieldEvidence;
  samples: Sample[];
  /** Index of the sample on screen, or null for the chosen read. */
  shown: number | null;
  onShow: (index: number | null) => void;
}

/** The chosen read followed by every sample frame considered for it; one is on screen at a time. */
export function SamplesStrip({ evidence, samples, shown, onShow }: SamplesStripProps) {
  return (
    <section aria-label="Samples" className="flex flex-col gap-1">
      <h4 className="text-xs font-medium text-muted-foreground">
        Samples <span className="tabular-nums">({samples.length})</span>
      </h4>
      <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        <Thumb
          url={evidence.screenshotUrl}
          label="Chosen"
          time={formatTimecode(evidence.atMs / 1000)}
          pressed={shown === null}
          onClick={() => onShow(null)}
        />
        {samples.map((sample, index) => (
          <Thumb
            key={`${sample.atMs}-${index}`}
            url={sample.screenshotUrl}
            label={`Sample ${index + 1}`}
            time={formatTimecode(sample.atMs / 1000)}
            pressed={shown === index}
            onClick={() => onShow(index)}
          />
        ))}
      </ul>
    </section>
  );
}
