import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { BACKEND_PUBLIC_KEY, BACKEND_URL } from "@/lib/backend";


export const supabaseServer = createClient<Database>(
  BACKEND_URL,
  BACKEND_PUBLIC_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

export async function getGlobalStats() {
  "use server";
  try {
    const { data, error } = await supabaseServer.rpc("get_global_stats");

    if (error) {
      console.error("Error fetching stats:", error);
      return { streamers: 0, vods: 0, matchups: 0 };
    }

    if (
      data &&
      typeof data === "object" &&
      "streamers" in data &&
      "vods" in data &&
      "matchups" in data
    ) {
      return {
        streamers: (data as any).streamers || 0,
        vods: (data as any).vods || 0,
        matchups: (data as any).matchups || 0,
      };
    }

    return { streamers: 0, vods: 0, matchups: 0 };
  } catch (err) {
    console.error("Error fetching stats:", err);
    return { streamers: 0, vods: 0, matchups: 0 };
  }
}

export async function getStreamerByLogin(login: string) {
  "use server";
  try {
    const { data, error } = await supabaseServer
      .from("streamers")
      .select("*")
      .eq("login", login)
      .maybeSingle();

    if (error) {
      console.error("Error fetching streamer by login:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error fetching streamer by login:", err);
    return null;
  }
}

export async function getStreamerVods(streamerLogin: string) {
  "use server";
  try {
    const { data, error } = await supabaseServer
      .from("vod_stats")
      .select("*")
      .eq("streamer", streamerLogin)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching streamer vods:", error);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error("Error fetching streamer vods:", err);
    return [];
  }
}

export type StreamerWithDetections =
  Database["public"]["Views"]["streamers_with_detections"]["Row"];

export async function getAllStreamers(): Promise<StreamerWithDetections[]> {
  "use server";
  try {
    const { data, error } = await supabaseServer
      .from("streamers_with_detections")
      .select("*")
      .order("detection_count", { ascending: false });

    if (error) {
      console.error("Error fetching all streamers:", error);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error("Error fetching all streamers:", err);
    return [];
  }
}

export async function getTopStreamers() {
  "use server";
  try {
    const { data, error } = await supabaseServer.rpc(
      "get_top_streamers_with_recent_detections",
      {
        detections_per_streamer: 5,
        top_count: 8,
      }
    );

    if (error) {
      console.error("Error fetching top streamers:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group the flattened results by streamer
    const streamerMap = new Map();

    data.forEach((row: any) => {
      if (!streamerMap.has(row.streamer_id)) {
        streamerMap.set(row.streamer_id, {
          streamer_id: row.streamer_id,
          streamer_login: row.streamer_login,
          streamer_display_name:
            row.streamer_display_name || row.streamer_login,
          streamer_avatar: row.streamer_avatar || "/placeholder.svg",
          total_detections: row.total_detections,
          total_vods: row.total_vods,
          recentDetections: [],
        });
      }

      const streamer = streamerMap.get(row.streamer_id);
      streamer.recentDetections.push(row);
    });

    return Array.from(streamerMap.values());
  } catch (err) {
    console.error("Error fetching top streamers:", err);
    return [];
  }
}
