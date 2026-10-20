import { ImageResponse } from "next/og";
import { getMatchup } from "@/lib/api-server";
import { matchupOwner } from "@/lib/result-models";
import averiaBold from "../../../../public/Averia_Libre/AveriaLibre-Bold.ttf?inline";

export const alt = "BazaarGhost matchup";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

const CREAM = "#fcf9ea";
const DARK = "#1a1a1a";
const ORANGE = "#ff9933";

function font() {
  try {
    const bytes = atob(averiaBold.slice(averiaBold.indexOf(",") + 1));
    return Uint8Array.from(bytes, (c) => c.charCodeAt(0)).buffer;
  } catch {
    return null;
  }
}

function Mark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, color: DARK }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: ORANGE }} />
      BazaarGhost
    </div>
  );
}

/** Share card for a matchup; renders from server data and degrades to a brand-only card. */
export default async function Image({ params }: Props) {
  const id = Number((await params).id);
  const detail = await getMatchup(id).catch(() => null);
  const bold = font();
  const matchup = detail;
  const fonts = bold ? [{ name: "Averia", data: bold, weight: 700 as const, style: "normal" as const }] : undefined;
  const root = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    background: CREAM,
    padding: 64,
    fontFamily: bold ? "Averia" : "serif",
    color: DARK,
  };
  const headers = { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" };

  if (!matchup) {
    return new ImageResponse(
      (
        <div style={{ ...root, alignItems: "center", justifyContent: "center", fontSize: 96 }}>
          <div style={{ color: ORANGE, display: "flex" }}>BazaarGhost</div>
        </div>
      ),
      { ...size, fonts, headers: { "Cache-Control": "public, max-age=60" } },
    );
  }

  const creator = matchupOwner(matchup);
  const { username, rank } = matchup.opponent;
  const long = (text: string) => (text.length > 18 ? 64 : 84);
  return new ImageResponse(
    (
      <div style={root}>
        <Mark />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: 480 }}>
            {creator.avatar ? (
              <img src={creator.avatar} width={220} height={220} alt="" style={{ borderRadius: 110, border: `8px solid ${ORANGE}` }} />
            ) : (
              <div style={{ width: 220, height: 220, borderRadius: 110, background: ORANGE }} />
            )}
            <div style={{ fontSize: long(creator.name), textAlign: "center", display: "flex" }}>{creator.name}</div>
          </div>
          <div style={{ fontSize: 56, color: ORANGE, display: "flex" }}>vs</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: 480 }}>
            <div style={{ width: 220, height: 220, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 0 }}>
              {rank ? (
                <div style={{ display: "flex", background: DARK, color: CREAM, fontSize: 44, padding: "10px 36px", borderRadius: 999 }}>
                  {rank}
                </div>
              ) : null}
            </div>
            <div style={{ fontSize: long(username), textAlign: "center", display: "flex" }}>{username}</div>
          </div>
        </div>
        <div style={{ display: "flex", height: 10, background: ORANGE, borderRadius: 5 }} />
      </div>
    ),
    { ...size, fonts, headers },
  );
}
