import { notFound, permanentRedirect } from "next/navigation";
import { recordingUrl, resolveVideoId } from "@/lib/api-server";

type Props = {
  params: Promise<{ streamer: string; vodId: string }>;
};

/** Legacy `/:streamer/:vodId` link: one-hop redirect to the Recording's Session page. */
export default async function VodPage({ params }: Props) {
  const { vodId } = await params;
  const id = await resolveVideoId(safeDecode(vodId));
  const url = id ? await recordingUrl(id) : null;
  if (!url) notFound();
  permanentRedirect(url);
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
