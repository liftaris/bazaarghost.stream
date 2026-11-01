import { ImageResponse } from "next/og";
import { getMatchup } from "@/lib/api-server";
import { getMatchupScreenshot } from "@/lib/matchup-screenshot";
import { MatchupCard } from "@/components/og/matchup-card";
import averiaBold from "../../../../public/Averia_Libre/AveriaLibre-Bold.ttf?inline";
import logo from "../../../../public/og/logo.png?inline";

export const alt = "BazaarGhost matchup";
export const size = { width: 1200, height: 675 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

function BrandingPills({ day }: { day: number | null }) {
  const pillStyle = {
    height: 72,
    borderRadius: 36,
    background: "rgba(26, 26, 26, 0.75)",
    backdropFilter: "blur(10px)",
    borderBottom: "3px solid #ff9933",
  };
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        width: "100%",
        height: "100%",
        padding: "18px 24px",
      }}
    >
      <div
        style={{
          ...pillStyle,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 12,
          color: "#ff9933",
          fontSize: 30,
        }}
      >
        <img src={logo} width={48} height={30} alt="" />
        BazaarGhost.stream
      </div>
      {day != null ? (
        <div
          style={{
            ...pillStyle,
            display: "flex",
            position: "absolute",
            top: 18,
            left: 500,
            width: 200,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontWeight: 700,
            color: "#f2d7b5",
          }}
        >
          Day {day}
        </div>
      ) : null}
    </div>
  );
}

/** Prefer the full matchup screenshot; keep generated cards for legacy or missing images. */
export default async function Image({ params }: Props) {
  const id = Number((await params).id);
  const matchup = await getMatchup(id).catch(() => null);
  const screenshot = matchup
    ? await getMatchupScreenshot(matchup.encounter)
    : null;
  const bytes = atob(averiaBold.slice(averiaBold.indexOf(",") + 1));
  const fonts = [
    {
      name: "Averia",
      data: Uint8Array.from(bytes, (c) => c.charCodeAt(0)).buffer,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];

  const render = (src: string | null) =>
    new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: "#1a1a1a",
          fontFamily: "Averia",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 1200,
            height: 675,
            overflow: "hidden",
          }}
        >
          {src ? (
            <img
              src={src}
              width={1200}
              height={750}
              alt=""
              style={{ position: "absolute", top: -75, left: 0, objectFit: "cover" }}
            />
          ) : (
            <MatchupCard matchup={matchup} />
          )}
        </div>
        <BrandingPills day={matchup?.encounter.igd ?? null} />
      </div>,
      {
        ...size,
        fonts,
        headers: {
          "Cache-Control": src
            ? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
            : "public, max-age=60",
        },
      }
    );

  if (screenshot) {
    try {
      const image = render(screenshot);
      return new Response(await image.arrayBuffer(), {
        headers: image.headers,
      });
    } catch {
      return render(null);
    }
  }
  return render(null);
}
