import { permanentRedirect } from "next/navigation";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Legacy `/vods`: the Recordings list, keeping the query. */
export default async function VodsPage({ searchParams }: Props) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) for (const v of [value ?? []].flat()) query.append(key, v);
  permanentRedirect(`/recordings${query.size ? `?${query}` : ""}`);
}
