import { notFound, permanentRedirect } from "next/navigation";
import { resolveTwitchSearch } from "@/lib/api-server";
import { RESERVED_TOP_LEVEL } from "@/components/search/lib/route-utils";

type Props = {
  params: Promise<{ streamer: string }>;
};

/** Legacy `/:streamer` link: resolve the channel server-side, else 404. */
export default async function StreamerPage({ params }: Props) {
  const { streamer } = await params;
  let name = streamer;
  try {
    name = decodeURIComponent(streamer);
  } catch {
    // malformed escape: keep the raw segment
  }
  if (RESERVED_TOP_LEVEL.includes(name.toLowerCase())) notFound();
  const query = await resolveTwitchSearch(name);
  if (!query) notFound();
  permanentRedirect(`/search?${query}`);
}
