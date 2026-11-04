import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { isSocialEnabled } from "@/lib/feature-flags";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (!next?.startsWith("/admin") && !(await isSocialEnabled())) notFound();
  return (
    <div className="flex flex-1 items-center justify-center">
      <Suspense>
        <LoginCard />
      </Suspense>
    </div>
  );
}
