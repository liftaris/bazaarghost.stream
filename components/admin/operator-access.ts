"use client";

import { createContext, useContext } from "react";
import type { OpsRoutes } from "@/lib/operator-contract";
import type { OpsResource } from "./hooks/use-ops-resource";

export const OperatorAccessContext = createContext<OpsResource<OpsRoutes["/me"]> | null>(null);

export function useOperatorAccess() {
  const access = useContext(OperatorAccessContext);
  if (!access) throw new Error("Operator access requires an authenticated console session");
  return access;
}
