import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/session-server";
import { isSocialEnabled } from "@/lib/feature-flags";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default async function SavedPage() {
  if (!(await isSocialEnabled())) notFound();
  if ((await getServerSession()).status === "anonymous") redirect("/login?next=/saved");
  return null;
}
