"use client";

import { useState, useEffect } from "react";
import type { Page, CreatorQuality } from "@/lib/api-contract";
import { apiGet } from "@/lib/api-client";

interface LowConfidenceStreamer {
  login: string;
  display_name: string;
  avg_confidence: number;
}

export function LowConfidenceStreamers() {
  const [streamers, setStreamers] = useState<LowConfidenceStreamer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLowConfidenceStreamers = async () => {
      try {
        const items: LowConfidenceStreamer[] = [];
        let cursor: string | null = null;
        do {
          const page: Page<CreatorQuality> = await apiGet("/creators/quality", { cursor });
          items.push(...page.items.map(row=>({login:row.login,display_name:row.displayName,avg_confidence:row.averageConfidence})));
          cursor=page.nextCursor;
        } while(cursor);
        setStreamers(items);
      } catch (err) {
        console.error("Error fetching low confidence streamers:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowConfidenceStreamers();
  }, []);

  if (isLoading || streamers.length === 0) {
    return null;
  }

  return (
    <ul className="list-disc pl-5 space-y-1">
      {streamers.map((streamer) => (
        <li key={streamer.login}>
          {streamer.display_name || streamer.login} -{" "}
          {(streamer.avg_confidence * 100).toFixed(1)}%
        </li>
      ))}
    </ul>
  );
}
