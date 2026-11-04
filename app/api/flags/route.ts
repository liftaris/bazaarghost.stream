import { isSocialEnabled } from "@/lib/feature-flags";

/** Read by the browser so the root layout stays static and cacheable. */
export async function GET() {
  return Response.json(
    { social: await isSocialEnabled() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
