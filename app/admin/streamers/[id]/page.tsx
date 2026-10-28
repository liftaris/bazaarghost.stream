import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StreamerInventory } from "@/components/admin";

type Props = { params: Promise<{ id: string }> };

/** Titles the page with the streamer id. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Streamer ${(await params).id}` };
}

/** `/admin/streamers/:id`: one streamer's platform inventory; non-numeric ids are not found. */
export default async function AdminStreamerPage({ params }: Props) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  return <StreamerInventory id={Number(id)} />;
}
