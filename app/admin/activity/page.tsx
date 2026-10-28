import type { Metadata } from "next";
import { Activity } from "@/components/admin";

export const metadata: Metadata = { title: "Activity" };

/** `/admin/activity`: recordings by latest chunk activity. */
export default function AdminActivityPage() {
  return <Activity />;
}
