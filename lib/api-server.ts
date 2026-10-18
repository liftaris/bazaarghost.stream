import { cache } from "react";
import { backendFetch } from "./backend-server";
import type { MatchupDetail } from "./api-contract";

/** Share the current public matchup between metadata and rendering within one request. */
export const getMatchup = cache(
  async (id: number): Promise<MatchupDetail | null> => {
    if (!Number.isSafeInteger(id) || id < 1) return null;
    const response = await backendFetch(
      new Request(`https://bazaarghost.stream/api/v1/matchups/${id}`)
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Could not load matchup");
    return response.json();
  }
);
