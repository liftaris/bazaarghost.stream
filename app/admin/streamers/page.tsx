import type { Metadata } from "next";
import { StreamerList } from "@/components/admin";

export const metadata: Metadata = { title: "Streamers" };

/** `/admin/streamers`: streamers by name, searchable. */
export default function AdminStreamersPage() {
  return <StreamerList />;
}
