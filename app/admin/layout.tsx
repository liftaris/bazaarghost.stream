import type { Metadata } from "next";
import { Suspense } from "react";
import { OperatorConsole } from "@/components/admin";

export const metadata: Metadata = {
  title: { default: "Operator console", template: "%s | Operator console" },
  robots: { index: false, follow: false },
};

/** Wraps every `/admin` page in the operator gate and console frame. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <OperatorConsole>{children}</OperatorConsole>
    </Suspense>
  );
}
