import { GhostLoader } from "@/components/ghost-loader";
/** Open any supported platform video by its stable ID. */
export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GhostLoader vodId={`v:${id}`} timestamp={0} />;
}
