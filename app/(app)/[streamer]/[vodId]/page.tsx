import { notFound, permanentRedirect } from "next/navigation";
import { resolveVideoId } from "@/lib/api-server";

type Props = {
  params: Promise<{ streamer: string; vodId: string }>;
};

/** Legacy `/:streamer/:vodId` link: one-hop redirect to the durable video URL. */
export default async function VodPage({ params }: Props) {
  const { vodId } = await params;
  const id = await resolveVideoId(safeDecode(vodId));
  if (!id) notFound();
  permanentRedirect(`/videos/${id}`);
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
