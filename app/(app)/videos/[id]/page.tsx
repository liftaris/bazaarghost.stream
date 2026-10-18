import type { Metadata } from "next";
import { GhostLoader } from "@/components/ghost-loader";
import { getVideo } from "@/lib/api-server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const video = await getVideo(Number((await params).id));
  if (!video) return { title: "Video unavailable" };
  const title = `${video.title} - ${video.creator.name}`;
  const description = `Browse ghost matchups from ${video.creator.name}'s stream on BazaarGhost.`;
  return {
    title,
    description,
    alternates: { canonical: `/videos/${video.id}` },
    openGraph: { title, description, url: `/videos/${video.id}`, siteName: "BazaarGhost", type: "website", images: [{ url: "/logo.png", width: 512, height: 512 }] },
    twitter: { card: "summary", title, description },
  };
}

/** Open any supported platform video by its stable ID. */
export default async function VideoPage({ params }: Props) {
  const { id } = await params;
  return <GhostLoader vodId={`v:${id}`} timestamp={0} />;
}
