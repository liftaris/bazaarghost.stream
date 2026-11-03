"use client";

import { createContext, type RefObject } from "react";

export type SearchHandoff = {
  query: string;
  complete: () => void;
};

export const SearchHandoffContext =
  createContext<RefObject<SearchHandoff | null> | null>(null);
