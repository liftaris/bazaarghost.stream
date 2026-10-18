import { notFound, permanentRedirect } from "next/navigation";
import { findMatchupId, resolveVideoId } from "@/lib/api-server";

type Props = {
  params: Promise<{ streamer: string; vodId: string; ghost: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Legacy `/:streamer/:vodId/:ghost` link: one-hop redirect to `/matchups/:id`.
 * `?t=` is the 1-based occurrence of the ghost within the VOD.
 */
export default async function GhostMatchPage({ params, searchParams }: Props) {
  const { vodId, ghost } = await params;
  const { t } = await searchParams;
  const occurrence = typeof t === "string" ? parseInt(t, 10) || 1 : 1;
  const videoId = await resolveVideoId(safeDecode(vodId));
  if (!videoId) notFound();
  const matchupId = await findMatchupId(videoId, safeDecode(ghost), occurrence);
  if (!matchupId) notFound();
  permanentRedirect(`/matchups/${matchupId}`);
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
