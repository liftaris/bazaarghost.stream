import { notFound, permanentRedirect } from "next/navigation";
import { recordingUrl } from "@/lib/api-server";

type Props = { params: Promise<{ id: string }> };

/** Legacy `/videos/:id` (a Recording id): its Session page, pinned to that Recording. */
export default async function VideoPage({ params }: Props) {
  const url = await recordingUrl(Number((await params).id));
  if (!url) notFound();
  permanentRedirect(url);
}
