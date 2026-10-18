import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { showSearchTabs } from "@/flags";

export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
  title: "Search VODs",
  description: "Browse and search Bazaar Twitch VODs tracked by BazaarGhost.",
};

export default async function VodsPage() {
  const tabs = showSearchTabs;
  if (!tabs) redirect("/search");
  return null;
}
