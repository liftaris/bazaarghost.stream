import type { Metadata } from "next";
import { Overview } from "@/components/admin";

export const metadata: Metadata = { title: "Overview" };

/** `/admin`: pipeline overview. */
export default function AdminOverviewPage() {
  return <Overview />;
}
