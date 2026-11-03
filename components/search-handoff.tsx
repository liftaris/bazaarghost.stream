"use client";

import { createContext, type RefObject } from "react";

/** The landing query waiting for the workspace input to mount and take focus. */
export const SearchHandoffContext = createContext<RefObject<
  string | null
> | null>(null);
