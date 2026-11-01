import { Buffer } from "node:buffer";
import type { Encounter } from "./api-contract";
import { backendFetch } from "./backend-server";

/** Load the selected full intro through the backend's public visibility check. */
export async function getMatchupScreenshot(
  encounter: Encounter
): Promise<string | null> {
  const evidence = encounter.fieldEvidence.encounter;
  if (
    !evidence?.screenshotUrl ||
    evidence.phase !== "intro" ||
    evidence.sourceWidth == null ||
    evidence.sourceHeight == null
  )
    return null;

  try {
    const url = new URL(evidence.screenshotUrl, "https://bazaarghost.stream");
    if (
      url.origin !== "https://bazaarghost.stream" ||
      !url.pathname.startsWith("/detections/")
    )
      return null;

    const response = await backendFetch(
      new Request(url, { signal: AbortSignal.timeout(5000) })
    );
    if (!response.ok) return null;
    const type = response.headers.get("content-type")?.split(";")[0];
    if (type !== "image/jpeg" && type !== "image/png") return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
