import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountView } from "@/components/auth/account-view";
import { isSocialEnabled } from "@/lib/feature-flags";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  if (!(await isSocialEnabled())) notFound();
  return <AccountView />;
}
