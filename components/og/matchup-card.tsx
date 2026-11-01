import { matchupOwner } from "@/lib/result-models";
import { opponentLabel } from "@/lib/opponent-name";
import type { Hero, MatchupDetail } from "@/lib/api-contract";
import bronze from "../../public/og/bronze.png?inline";
import silver from "../../public/og/silver.png?inline";
import gold from "../../public/og/gold.png?inline";
import diamond from "../../public/og/diamond.png?inline";
import legend from "../../public/og/legend.png?inline";
import vanessa from "../../public/og/heroes/vanessa.png?inline";
import pygmalien from "../../public/og/heroes/pygmalien.png?inline";
import dooley from "../../public/og/heroes/dooley.png?inline";
import mak from "../../public/og/heroes/mak.png?inline";
import jules from "../../public/og/heroes/jules.png?inline";
import stelle from "../../public/og/heroes/stelle.png?inline";
import karnok from "../../public/og/heroes/karnok.png?inline";
import theDragons from "../../public/og/heroes/the_dragons.png?inline";

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

function PlayerName({ name }: { name: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", width: 480 }}>
      <div style={{ display: "block", maxWidth: "100%", fontSize: 60, lineHeight: 1.05, textAlign: "center", wordBreak: "break-all", lineClamp: 2 }}>
        {name}
      </div>
    </div>
  );
}

/** Generated fallback when a public full-frame matchup screenshot is unavailable. */
export function MatchupCard({ matchup }: { matchup: MatchupDetail | null }) {
  const root = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    background: DARK,
    padding: 64,
    color: FOREGROUND,
    position: "relative" as const,
    overflow: "hidden" as const,
  };
  if (!matchup) {
    return (
      <div style={{ ...root, alignItems: "center", justifyContent: "center", fontSize: 96 }}>
        <div style={{ color: ORANGE, display: "flex" }}>BazaarGhost</div>
      </div>
    );
  }

  const creator = matchupOwner(matchup);
  const { rank } = matchup.opponent;
  const opponent = opponentLabel(matchup.opponent);
  const badge = rank ? RANK_BADGES[rank.toLowerCase()] : undefined;
  return (
    <div style={root}>
      <HeroBackdrop hero={matchup.encounter.streamerHero} side="left" />
      <HeroBackdrop hero={matchup.encounter.ghostHero} side="right" />
      <div
        style={{
          position: "absolute",
          top: 120,
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
        style={{ position: "absolute", top: 352, left: 110, width: 980, display: "flex", gap: 20 }}
      >
        <PlayerName name={creator.name} />
        <PlayerName name={opponent} />
      </div>
    </div>
  );
}
