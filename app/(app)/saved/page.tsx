import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session-server";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default async function SavedPage() {
  if ((await getServerSession()).status === "anonymous") redirect("/login?next=/saved");
  return null;
}
