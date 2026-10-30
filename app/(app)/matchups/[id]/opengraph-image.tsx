import { ImageResponse } from "next/og";
import { getMatchup } from "@/lib/api-server";
import { matchupOwner } from "@/lib/result-models";
import { opponentLabel } from "@/lib/opponent-name";
import type { Hero } from "@/lib/api-contract";
import averiaBold from "../../../../public/Averia_Libre/AveriaLibre-Bold.ttf?inline";
import logo from "../../../../public/og/logo.png?inline";
import bronze from "../../../../public/og/bronze.png?inline";
import silver from "../../../../public/og/silver.png?inline";
import gold from "../../../../public/og/gold.png?inline";
import diamond from "../../../../public/og/diamond.png?inline";
import legend from "../../../../public/og/legend.png?inline";
import vanessa from "../../../../public/og/heroes/vanessa.png?inline";
import pygmalien from "../../../../public/og/heroes/pygmalien.png?inline";
import dooley from "../../../../public/og/heroes/dooley.png?inline";
import mak from "../../../../public/og/heroes/mak.png?inline";
import jules from "../../../../public/og/heroes/jules.png?inline";
import stelle from "../../../../public/og/heroes/stelle.png?inline";
import karnok from "../../../../public/og/heroes/karnok.png?inline";
import theDragons from "../../../../public/og/heroes/the_dragons.png?inline";

export const alt = "BazaarGhost matchup";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

const DARK = "#1a1a1a";
const FOREGROUND = "#f5f5f5";
const ORANGE = "#ff9933";

const RANK_BADGES: Record<string, string> = { bronze, silver, gold, diamond, legend };
const HERO_INSETS: Record<Hero, string> = {
  vanessa,
  pygmalien,
  dooley,
  mak,
  jules,
  stelle,
  karnok,
  the_dragons: theDragons,
};

function HeroBackdrop({
  hero,
  side,
}: {
  hero: Hero | null;
  side: "left" | "right";
}) {
  return hero ? (
    <img
      src={HERO_INSETS[hero]}
      width={500}
      height={500}
      alt=""
      style={{
        position: "absolute",
        bottom: -24,
        [side]: -24,
        objectFit: "contain",
        objectPosition: "right bottom",
        transform: side === "left" ? "scaleX(-1)" : "scaleX(1)",
      }}
    />
  ) : null;
}

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
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, width: "100%" }}>
      <span style={{ fontSize: 34 }}>Watch on</span>
      <span style={{ fontSize: 48, color: ORANGE }}>BazaarGhost</span>
      <img src={logo} width={80} height={50} alt="" />
    </div>
  );
}

function PlayerName({ name }: { name: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", width: 480 }}>
      <div style={{ display: "block", maxWidth: "100%", fontSize: 60, lineHeight: 1.05, textAlign: "center", wordBreak: "break-all", lineClamp: 2 }}>
        {name}
      </div>
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
    background: DARK,
    padding: 64,
    fontFamily: bold ? "Averia" : "serif",
    color: FOREGROUND,
    position: "relative" as const,
    overflow: "hidden" as const,
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
  const { rank } = matchup.opponent;
  const opponent = opponentLabel(matchup.opponent);
  const badge = rank ? RANK_BADGES[rank.toLowerCase()] : undefined;
  const day = matchup.encounter.igd;
  return new ImageResponse(
    <div style={root}>
      <HeroBackdrop hero={matchup.encounter.streamerHero} side="left" />
      <HeroBackdrop hero={matchup.encounter.ghostHero} side="right" />
      <Mark />
      <div
        style={{
          position: "absolute",
          top: 148,
          left: 230,
          width: 740,
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 240,
            flexShrink: 0,
          }}
        >
          {creator.avatar ? (
            <img
              src={creator.avatar}
              width={200}
              height={200}
              alt=""
              style={{ borderRadius: 100, border: `6px solid ${ORANGE}` }}
            />
          ) : (
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                background: ORANGE,
              }}
            />
          )}
        </div>
        <div style={{ fontSize: 40, color: "#a0a0a0", display: "flex" }}>vs</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 240,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 128,
              height: 128,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {badge ? (
              <img src={badge} width={128} height={128} alt={rank ?? ""} />
            ) : null}
          </div>
        </div>
      </div>
      <div
        style={{ position: "absolute", top: 380, left: 110, width: 980, display: "flex", gap: 20 }}
      >
        <PlayerName name={creator.name} />
        <PlayerName name={opponent} />
      </div>
      {day != null ? (
        <div style={{ display: "flex", justifyContent: "center", width: "100%", fontSize: 40, color: ORANGE }}>
          Day {day}
        </div>
      ) : null}
    </div>,
    { ...size, fonts, headers }
  );
}
