"use client";

import { useState } from "react";
import type { OpsRecording } from "@/lib/operator-contract";
import { DataTable } from "../data-table";
import { RecordingRow } from "./recording-row";

/** Activity rows newest activity first; any number of rows can be expanded at once. */
export function RecordingsTable({ recordings }: { recordings: OpsRecording[] }) {
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(() => new Set());
  const toggle = (id: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <DataTable label="Recordings by latest activity">
      <thead>
        <tr>
          <th scope="col">
            <span className="sr-only">Expand</span>
          </th>
          <th scope="col" className="px-1!">
            <span className="sr-only">Platform</span>
          </th>
          <th scope="col" className="hidden @4xl:table-cell">
            Streamer
          </th>
          <th scope="col">Title</th>
          <th scope="col" className="hidden @5xl:table-cell">
            Published
          </th>
          <th scope="col">Chunks</th>
          <th scope="col" className="text-right!">
            Detections
          </th>
          <th scope="col">Status</th>
          <th scope="col">Last activity</th>
        </tr>
      </thead>
      <tbody>
        {recordings.map((recording) => (
          <RecordingRow
            key={recording.id}
            recording={recording}
            expanded={expanded.has(recording.id)}
            onToggle={() => toggle(recording.id)}
          />
        ))}
      </tbody>
    </DataTable>
  );
}
