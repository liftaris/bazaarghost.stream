import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{ username: string }>;
};

/** Legacy ghost profile URL: the search view owns ghost lookups. */
export default async function GhostProfilePage({ params }: Props) {
  const { username } = await params;
  permanentRedirect(`/search?q=${encodeURIComponent(safeDecode(username))}`);
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
