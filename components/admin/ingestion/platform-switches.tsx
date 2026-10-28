import { Check, Minus } from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";
import type { OpsIngestion } from "@/lib/operator-contract";
import { getPlatform } from "@/lib/platforms/registry";
import { cn } from "@/lib/utils";
import { DataTable } from "../data-table";

type Platform = OpsIngestion["platforms"][number];

const SWITCHES = [
  ["ingestionEnabled", "Ingestion"],
  ["discoveryEnabled", "Discovery"],
  ["processingEnabled", "Processing"],
  ["notificationsEnabled", "Notifications"],
] as const satisfies readonly (readonly [keyof Platform, string])[];

function Switch({ on }: { on: boolean }) {
  const Icon = on ? Check : Minus;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", on ? "font-medium text-foreground" : "text-muted-foreground")}>
      <Icon aria-hidden className="size-3.5" />
      {on ? "On" : "Off"}
    </span>
  );
}

/** Each platform's ingestion switches as read-only facts. */
export function PlatformSwitches({ platforms }: { platforms: OpsIngestion["platforms"] }) {
  return (
    <DataTable label="Platform switches">
      <thead>
        <tr>
          <th scope="col">Platform</th>
          {SWITCHES.map(([key, label]) => (
            <th key={key} scope="col">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {platforms.map((platform) => (
          <tr key={platform.platform}>
            <th scope="row" className="font-medium! text-foreground! text-sm!">
              <span className="flex items-center gap-2">
                <PlatformIcon platform={platform.platform} decorative className="size-3.5" />
                {getPlatform(platform.platform).name}
              </span>
            </th>
            {SWITCHES.map(([key]) => (
              <td key={key}>
                <Switch on={platform[key]} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}
