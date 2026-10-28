import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecordingView } from "@/components/admin";

type Props = { params: Promise<{ id: string }> };

/** Titles the page with the recording id. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Recording ${(await params).id}` };
}

/** `/admin/recordings/:id`: one recording with its chunk timeline; non-numeric ids are not found. */
export default async function AdminRecordingPage({ params }: Props) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  return <RecordingView id={Number(id)} />;
}
