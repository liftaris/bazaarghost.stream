"use client";

import { createContext, useContext } from "react";

/** True while AppShell shows the search/player workspace (not a content route). */
export const WorkspaceContext = createContext(true);

export function useWorkspaceActive() {
  return useContext(WorkspaceContext);
}
