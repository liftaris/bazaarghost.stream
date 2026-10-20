import { Ghost, Users, Video } from "lucide-react";
import type { SearchMode } from "./types";

/** The modality chips, in display order. */
export const modeOptions: {
  value: Exclude<SearchMode, "saved">;
  label: string;
  icon: typeof Ghost;
  placeholder: string;
}[] = [
  { value: "ghosts", label: "Ghosts", icon: Ghost, placeholder: "Ghost username…" },
  { value: "streamers", label: "Streamers", icon: Users, placeholder: "Streamer name…" },
  { value: "recordings", label: "Recordings", icon: Video, placeholder: "Recording title…" },
];
