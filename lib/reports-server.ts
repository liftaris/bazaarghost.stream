import { env } from "cloudflare:workers";
import { parseReport, REPORT_BODY_MAX, type StoredReport } from "@/lib/reports";

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

/**
 * Anonymous user reports. Each is one KV entry keyed `report:<createdAt>:<id>`, so
 * `cf kv list` returns them oldest first and the metadata alone is enough to triage.
 */
export async function handleReport(request: Request): Promise<Response> {
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return json({ error: "Forbidden" }, 403);
  const text = await request.text();
  if (text.length > REPORT_BODY_MAX)
    return json({ error: "Report is too large" }, 413);
  let submission;
  try {
    submission = parseReport(JSON.parse(text));
  } catch {
    submission = null;
  }
  if (!submission) return json({ error: "Invalid report" }, 400);

  const cf = (request as Request & { cf?: { country?: string } }).cf;
  const report: StoredReport = {
    ...submission,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    server: {
      country: cf?.country ?? null,
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
    },
  };
  await env.REPORTS.put(
    `report:${report.createdAt}:${report.id}`,
    JSON.stringify(report),
    {
      metadata: {
        category: report.category,
        target: `${report.target.kind}:${report.target.id ?? ""}`,
        message: report.message.slice(0, 200),
      },
    }
  );
  return json({ id: report.id }, 201);
}
