export type PlayerShortcutAction =
  | "playPause"
  | "back10"
  | "forward10"
  | "back5"
  | "forward5"
  | "nextGhost"
  | "prevGhost"
  | "mute"
  | "fullscreen"
  | "save"
  | "close";

/** Display keys (first is the primary one) and tooltip label per action. */
export const PLAYER_SHORTCUTS: Record<PlayerShortcutAction, { keys: string[]; label: string }> = {
  playPause: { keys: ["Space", "K"], label: "Play/pause" },
  back10: { keys: ["J"], label: "Back 10s" },
  forward10: { keys: ["L"], label: "Forward 10s" },
  back5: { keys: ["←"], label: "Back 5s" },
  forward5: { keys: ["→"], label: "Forward 5s" },
  nextGhost: { keys: ["N", "Shift+→"], label: "Next ghost" },
  prevGhost: { keys: ["P", "Shift+←"], label: "Previous ghost" },
  mute: { keys: ["M"], label: "Mute" },
  fullscreen: { keys: ["F"], label: "Fullscreen" },
  save: { keys: ["S"], label: "Save ghost" },
  close: { keys: ["Esc"], label: "Close player" },
};

/** "Next ghost (N)" */
export function shortcutHint(action: PlayerShortcutAction): string {
  const { keys, label } = PLAYER_SHORTCUTS[action];
  return `${label} (${keys[0]})`;
}
