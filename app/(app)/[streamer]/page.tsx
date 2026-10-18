import { notFound, permanentRedirect } from "next/navigation";
import { resolveTwitchCreator } from "@/lib/api-server";
import { RESERVED_TOP_LEVEL } from "@/components/search/lib/route-utils";

type Props = {
  params: Promise<{ streamer: string }>;
};

/** Legacy `/:streamer` link: resolve the creator server-side, else 404. */
export default async function StreamerPage({ params }: Props) {
  const { streamer } = await params;
  let name = streamer;
  try {
    name = decodeURIComponent(streamer);
  } catch {}
  if (RESERVED_TOP_LEVEL.includes(name.toLowerCase())) notFound();
  const creator = await resolveTwitchCreator(name);
  if (!creator) notFound();
  permanentRedirect(`/search?streamer=${encodeURIComponent(creator.id)}`);
}
