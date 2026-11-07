import { env } from "cloudflare:workers";
import { parseReport, REPORT_BODY_MAX, type StoredReport } from "@/lib/reports";

/** Reports hold country, user agent and referer, so they expire instead of piling up. */
const REPORT_TTL_SECONDS = 180 * 24 * 60 * 60;

/** KV rejects metadata over 1024 bytes once serialized, so the message preview shrinks to fit. */
function listMetadata(report: StoredReport) {
  const base = {
    category: report.category,
    target: `${report.target.kind}:${report.target.id ?? ""}`,
  };
  let message = report.message.slice(0, 200);
  const size = (m: string) =>
    new TextEncoder().encode(JSON.stringify({ ...base, message: m })).length;
  while (message && size(message) > 1000)
    message = message.slice(0, Math.floor(message.length / 2));
  return { ...base, message };
}

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
  const client = request.headers.get("cf-connecting-ip") ?? "unknown";
  const { success } = await env.REPORT_LIMITER.limit({ key: client });
  if (!success)
    return json({ error: "Too many reports. Try again in a minute." }, 429);
  if (Number(request.headers.get("content-length")) > REPORT_BODY_MAX)
    return json({ error: "Report is too large" }, 413);
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
      expirationTtl: REPORT_TTL_SECONDS,
      metadata: listMetadata(report),
    }
  );
  return json({ id: report.id }, 201);
}
