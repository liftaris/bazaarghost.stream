/** Narrow presentation input until the nullable SFDE contract is regenerated. */
export interface OpponentName {
  username: string | null;
  nameState?: string;
}

/** Display only: never use this label as a username, search term or identifier. */
export function opponentLabel(opponent: OpponentName): string {
  if (opponent.nameState === "masked") return "Hidden opponent";
  return opponent.username ?? "Unknown opponent";
}

/** Read the additive wire field without editing the not-yet-regenerated API types. */
export function opponentNameState(opponent: OpponentName): string | undefined {
  return opponent.nameState;
}
