import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { showSearchTabs } from "@/flags";

export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
  title: "Search Streamers",
  description: "Browse and search tracked Bazaar streamers on BazaarGhost.",
};

export default async function StreamersPage() {
  const tabs = showSearchTabs;
  if (!tabs) redirect("/search");
  return null;
}
