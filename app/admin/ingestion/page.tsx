import type { Metadata } from "next";
import { Ingestion } from "@/components/admin";

export const metadata: Metadata = { title: "Ingestion" };

/** `/admin/ingestion`: platform switches, dispatch state, Twitch catalog work and ingestion jobs. */
export default function AdminIngestionPage() {
  return <Ingestion />;
}
