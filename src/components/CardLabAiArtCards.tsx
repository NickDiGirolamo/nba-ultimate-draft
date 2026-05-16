import { useMemo, useState } from "react";
import { Handshake, Image, Link2, Orbit, Sparkles, Users } from "lucide-react";
import { allPlayers } from "../data/players";
import { getNbaTeamByName } from "../data/nbaTeams";
import { playerTypeBadgeStyleClass, renderPlayerTypeBadgeIcon } from "./PlayerTypeBadges";
import {
  aiCardArtStatusDetails,
  aiCardArtStatusLabels,
  getAiCardArtRecord,
  getAiCardArtStatus,
  getAiCardGeneratedCutout,
  getAiCardReferenceImage,
} from "../lib/aiCardArt";
import { getPlayerTier } from "../lib/playerTier";
import { getPlayerTypeBadges } from "../lib/playerTypeBadges";
import type { Player } from "../types";
import type { PlayerTypeBadge } from "../lib/playerTypeBadges";

type AiArtTier = "Emerald" | "Sapphire" | "Ruby" | "Amethyst" | "Galaxy";
type AiPreviewSurface = "Full Art Card" | "Tier Background";
type AiArtTab = "Preview Lab" | "Player Cards";

const aiArtTabs: AiArtTab[] = ["Preview Lab", "Player Cards"];
const aiArtTiers: AiArtTier[] = ["Emerald", "Sapphire", "Ruby", "Amethyst", "Galaxy"];
const aiPreviewSurfaces: AiPreviewSurface[] = ["Full Art Card", "Tier Background"];
const testCardTeamName = "San Antonio Spurs";
const testCardPositions = "C/PF";
const testCardArchetype = "THE ALIEN";
const testCardPlayerName = "Victor Wembanyama";
const testCardOverall = 92;
const testCardBadges: Array<{ type: PlayerTypeBadge; label: string; detail: string }> = [
  { type: "lockdown", label: "Lockdown", detail: "Alters shots and anchors the paint." },
  { type: "slasher", label: "Slasher", detail: "Pressure at the rim from long strides." },
  { type: "board-man", label: "Board Man", detail: "Controls misses above the crowd." },
  { type: "sniper", label: "Sniper", detail: "Stretches defenses from deep." },
];
const testChemistryBadges = [
  {
    label: "Same Team",
    detail: "Same Team Chemistry: matching NBA teams can activate a +1 OVR run boost.",
    icon: Users,
  },
  {
    label: "Dynamic Duo",
    detail: "Dynamic Duo: draft this player with a linked teammate to unlock a chemistry boost.",
    icon: Link2,
  },
  {
    label: "Lineup Fit",
    detail: "Lineup Fit: balanced roles, positions, and player types raise team chemistry.",
    icon: Orbit,
  },
  {
    label: "Hot Link",
    detail: "Hot Link: special run synergies can add extra value when roster conditions are met.",
    icon: Sparkles,
  },
];
const tierStyles: Record<
  AiArtTier,
  {
    border: string;
    glow: string;
    pill: string;
    backdrop: string;
  }
> = {
  Emerald: {
    border: "border-emerald-200/60",
    glow: "shadow-[0_22px_54px_rgba(52,211,153,0.24)]",
    pill: "border-emerald-200/45 bg-emerald-300/18 text-emerald-50",
    backdrop: "from-emerald-300/28 via-slate-950/18 to-emerald-950/78",
  },
  Sapphire: {
    border: "border-sky-200/60",
    glow: "shadow-[0_22px_54px_rgba(56,189,248,0.24)]",
    pill: "border-sky-200/45 bg-sky-300/18 text-sky-50",
    backdrop: "from-sky-300/28 via-slate-950/18 to-blue-950/78",
  },
  Ruby: {
    border: "border-rose-200/60",
    glow: "shadow-[0_22px_54px_rgba(251,113,133,0.24)]",
    pill: "border-rose-200/45 bg-rose-300/18 text-rose-50",
    backdrop: "from-rose-300/28 via-slate-950/18 to-red-950/78",
  },
  Amethyst: {
    border: "border-violet-200/60",
    glow: "shadow-[0_22px_54px_rgba(192,132,252,0.26)]",
    pill: "border-violet-200/45 bg-violet-300/18 text-violet-50",
    backdrop: "from-violet-300/30 via-slate-950/18 to-purple-950/78",
  },
  Galaxy: {
    border: "border-fuchsia-100/70",
    glow: "shadow-[0_24px_62px_rgba(217,70,239,0.26),0_0_36px_rgba(125,211,252,0.18)]",
    pill: "border-fuchsia-100/50 bg-fuchsia-300/18 text-fuchsia-50",
    backdrop: "from-fuchsia-300/28 via-sky-300/12 to-slate-950/82",
  },
};

const defaultImageUrls: Record<AiArtTier, string> = {
  Emerald: "",
  Sapphire: "",
  Ruby: "",
  Amethyst: "/ai-card-art/wembanyama-amethyst.png",
  Galaxy: "",
};

const defaultBackgroundUrls: Record<AiArtTier, string> = {
  Emerald: "/ai-card-art/backgrounds/emerald-chatgpt-reference-bg.png",
  Sapphire: "/ai-card-art/backgrounds/sapphire-chatgpt-reference-bg.png",
  Ruby: "/ai-card-art/backgrounds/ruby-chatgpt-reference-bg.png",
  Amethyst: "/ai-card-art/backgrounds/amethyst-chatgpt-reference-bg.png",
  Galaxy: "/ai-card-art/backgrounds/galaxy-chatgpt-reference-bg.png",
};

const approvedReferenceCards = [
  {
    id: "steph-curry-amethyst-approved",
    title: "Steph Curry",
    subtitle: "Approved Amethyst Rogue card direction",
    imageUrl: "/ai-card-art/references/steph-curry-amethyst-approved.png",
    details: "93 OVR / PG-SG / Gravity Shooter / Sniper, Playmaker, Slasher",
  },
  {
    id: "michael-jordan-galaxy-approved",
    title: "Michael Jordan",
    subtitle: "Approved Galaxy Rogue card direction",
    imageUrl: "/ai-card-art/references/michael-jordan-galaxy-approved.png",
    details: "100 OVR / SG-SF / Two-Way Scoring Titan / Sniper, Slasher, Lockdown, Playmaker, Board Man",
  },
  {
    id: "al-horford-warriors-emerald-approved",
    title: "Al Horford (Warriors)",
    subtitle: "Approved Emerald Rogue card direction",
    imageUrl: "/ai-card-art/references/al-horford-warriors-emerald-approved.png",
    details: "79 OVR / C / Rotation Piece / Lockdown",
  },
];

const splitCardFaceName = (name: string) => (name.trim() || "AI Art Player").split(/\s+/).filter(Boolean);
const getCleanPlayerName = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, "").trim();

const getFittedNameWordSize = (word: string, maxRem: number, minRem: number, scale: number) =>
  `${Math.max(minRem, Math.min(maxRem, scale / Math.max(word.length, 1))).toFixed(2)}rem`;

const getAiCardLaunchPlayersByTier = () => {
  const grouped = aiArtTiers.reduce(
    (accumulator, tier) => ({
      ...accumulator,
      [tier]: [] as Player[],
    }),
    {} as Record<AiArtTier, Player[]>,
  );

  allPlayers.forEach((player) => {
    const tier = getPlayerTier(player) as AiArtTier;
    if (tier in grouped) grouped[tier].push(player);
  });

  const emeraldAndre = allPlayers.find((player) => player.id === "andre-jackson-jr-2025-26");

  return aiArtTiers.reduce((accumulator, tier) => {
    const sortedPlayers = [...grouped[tier]].sort((left, right) => {
      if (right.overall !== left.overall) return right.overall - left.overall;
      return getCleanPlayerName(left.name).localeCompare(getCleanPlayerName(right.name));
    });

    const tierPlayers =
      tier === "Emerald" && emeraldAndre
        ? [emeraldAndre, ...sortedPlayers.filter((player) => player.id !== emeraldAndre.id)]
        : sortedPlayers;

    return {
      ...accumulator,
      [tier]: tierPlayers.slice(0, 5),
    };
  }, {} as Record<AiArtTier, Player[]>);
};

const tierMineralBackgrounds: Record<
  AiArtTier,
  {
    base: string;
    facets: string;
    veins: string;
    crystal: string;
    shard: string;
    brightShard: string;
    accent: string;
    plate: string;
  }
> = {
  Emerald: {
    base:
      "radial-gradient(circle at 62% 18%, rgba(167,243,208,0.34), transparent 20%), linear-gradient(135deg, #052e1d 0%, #064e3b 34%, #02140e 72%, #06140f 100%)",
    facets:
      "linear-gradient(118deg, transparent 0 13%, rgba(16,185,129,0.38) 14% 18%, transparent 19% 36%, rgba(110,231,183,0.26) 37% 41%, transparent 42% 100%)",
    veins:
      "repeating-linear-gradient(62deg, transparent 0 15px, rgba(209,250,229,0.16) 16px 18px, transparent 20px 34px), repeating-linear-gradient(132deg, transparent 0 28px, rgba(5,150,105,0.28) 30px 33px, transparent 35px 58px)",
    crystal:
      "linear-gradient(135deg, rgba(236,253,245,0.34), rgba(52,211,153,0.78) 28%, rgba(6,95,70,0.7) 58%, rgba(2,44,34,0.9) 100%)",
    shard: "linear-gradient(135deg, rgba(209,250,229,0.7), rgba(16,185,129,0.16), transparent 78%)",
    brightShard: "linear-gradient(128deg, rgba(236,253,245,0.88), rgba(52,211,153,0.42) 42%, rgba(6,95,70,0.12) 78%)",
    accent: "rgba(110,231,183,0.8)",
    plate: "rgba(6,78,59,0.38)",
  },
  Sapphire: {
    base:
      "radial-gradient(circle at 58% 16%, rgba(186,230,253,0.3), transparent 21%), linear-gradient(135deg, #071f4d 0%, #075985 36%, #020617 78%, #07111f 100%)",
    facets:
      "linear-gradient(118deg, transparent 0 12%, rgba(14,165,233,0.4) 13% 18%, transparent 19% 34%, rgba(125,211,252,0.22) 35% 41%, transparent 42% 100%)",
    veins:
      "repeating-linear-gradient(68deg, transparent 0 14px, rgba(224,242,254,0.15) 16px 18px, transparent 20px 38px), repeating-linear-gradient(128deg, transparent 0 27px, rgba(2,132,199,0.28) 29px 33px, transparent 35px 58px)",
    crystal:
      "linear-gradient(135deg, rgba(224,242,254,0.34), rgba(56,189,248,0.72) 28%, rgba(29,78,216,0.7) 58%, rgba(15,23,42,0.92) 100%)",
    shard: "linear-gradient(135deg, rgba(186,230,253,0.72), rgba(59,130,246,0.16), transparent 78%)",
    brightShard: "linear-gradient(128deg, rgba(224,242,254,0.9), rgba(56,189,248,0.42) 42%, rgba(30,64,175,0.14) 78%)",
    accent: "rgba(125,211,252,0.82)",
    plate: "rgba(7,89,133,0.38)",
  },
  Ruby: {
    base:
      "radial-gradient(circle at 62% 17%, rgba(254,202,202,0.28), transparent 21%), linear-gradient(135deg, #4c0519 0%, #991b1b 34%, #17070b 76%, #100509 100%)",
    facets:
      "linear-gradient(118deg, transparent 0 12%, rgba(244,63,94,0.42) 13% 18%, transparent 19% 34%, rgba(251,113,133,0.24) 35% 42%, transparent 43% 100%)",
    veins:
      "repeating-linear-gradient(66deg, transparent 0 14px, rgba(254,226,226,0.14) 16px 18px, transparent 20px 37px), repeating-linear-gradient(131deg, transparent 0 26px, rgba(220,38,38,0.32) 29px 33px, transparent 35px 56px)",
    crystal:
      "linear-gradient(135deg, rgba(254,226,226,0.3), rgba(244,63,94,0.78) 30%, rgba(127,29,29,0.78) 60%, rgba(24,5,10,0.94) 100%)",
    shard: "linear-gradient(135deg, rgba(254,202,202,0.68), rgba(225,29,72,0.18), transparent 78%)",
    brightShard: "linear-gradient(128deg, rgba(254,226,226,0.86), rgba(244,63,94,0.44) 42%, rgba(127,29,29,0.14) 78%)",
    accent: "rgba(251,113,133,0.82)",
    plate: "rgba(127,29,29,0.4)",
  },
  Amethyst: {
    base:
      "radial-gradient(circle at 60% 17%, rgba(233,213,255,0.32), transparent 21%), linear-gradient(135deg, #2e1065 0%, #6d28d9 32%, #18052e 73%, #0f0718 100%)",
    facets:
      "linear-gradient(118deg, transparent 0 12%, rgba(168,85,247,0.42) 13% 18%, transparent 19% 34%, rgba(216,180,254,0.24) 35% 42%, transparent 43% 100%)",
    veins:
      "repeating-linear-gradient(66deg, transparent 0 14px, rgba(243,232,255,0.14) 16px 18px, transparent 20px 37px), repeating-linear-gradient(131deg, transparent 0 26px, rgba(147,51,234,0.32) 29px 33px, transparent 35px 56px)",
    crystal:
      "linear-gradient(135deg, rgba(243,232,255,0.32), rgba(168,85,247,0.78) 28%, rgba(88,28,135,0.74) 60%, rgba(20,8,31,0.94) 100%)",
    shard: "linear-gradient(135deg, rgba(233,213,255,0.7), rgba(168,85,247,0.18), transparent 78%)",
    brightShard: "linear-gradient(128deg, rgba(243,232,255,0.88), rgba(168,85,247,0.44) 42%, rgba(88,28,135,0.14) 78%)",
    accent: "rgba(216,180,254,0.82)",
    plate: "rgba(88,28,135,0.4)",
  },
  Galaxy: {
    base:
      "radial-gradient(circle at 72% 22%, rgba(125,211,252,0.28), transparent 16%), radial-gradient(circle at 32% 36%, rgba(217,70,239,0.2), transparent 18%), radial-gradient(circle at 50% 58%, rgba(15,23,42,0.18), transparent 24%), linear-gradient(145deg, #020617 0%, #07111f 34%, #111827 58%, #020617 82%, #000000 100%)",
    facets:
      "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.9) 0 0.7px, transparent 1.1px), radial-gradient(circle at 72% 32%, rgba(255,255,255,0.82) 0 0.8px, transparent 1.2px), radial-gradient(circle at 46% 76%, rgba(255,255,255,0.7) 0 0.7px, transparent 1.1px), radial-gradient(circle at 86% 66%, rgba(125,211,252,0.78) 0 1px, transparent 1.4px), radial-gradient(circle at 28% 62%, rgba(244,114,182,0.64) 0 0.9px, transparent 1.4px)",
    veins:
      "linear-gradient(118deg, transparent 0 15%, rgba(125,211,252,0.14) 16% 19%, transparent 20% 44%, rgba(217,70,239,0.15) 45% 50%, transparent 51% 100%), linear-gradient(32deg, transparent 0 34%, rgba(255,255,255,0.12) 35% 36%, transparent 37% 100%)",
    crystal:
      "radial-gradient(ellipse at 52% 38%, rgba(125,211,252,0.16), transparent 42%), radial-gradient(ellipse at 42% 52%, rgba(217,70,239,0.24), transparent 46%), linear-gradient(135deg, rgba(15,23,42,0.08), rgba(79,70,229,0.2) 36%, rgba(2,6,23,0.7) 72%, rgba(0,0,0,0.94) 100%)",
    shard: "linear-gradient(135deg, rgba(125,211,252,0.22), rgba(217,70,239,0.12), transparent 78%)",
    brightShard: "linear-gradient(128deg, rgba(240,249,255,0.42), rgba(125,211,252,0.22) 30%, rgba(217,70,239,0.2) 58%, transparent 82%)",
    accent: "rgba(240,249,255,0.84)",
    plate: "rgba(49,46,129,0.42)",
  },
};

const tierReferencePalettes: Record<
  AiArtTier,
  {
    primary: string;
    secondary: string;
    glow: string;
    muted: string;
  }
> = {
  Emerald: {
    primary: "rgba(52,211,153,0.96)",
    secondary: "rgba(167,243,208,0.78)",
    glow: "rgba(16,185,129,0.44)",
    muted: "rgba(6,78,59,0.78)",
  },
  Sapphire: {
    primary: "rgba(56,189,248,0.96)",
    secondary: "rgba(191,219,254,0.78)",
    glow: "rgba(37,99,235,0.48)",
    muted: "rgba(30,64,175,0.78)",
  },
  Ruby: {
    primary: "rgba(244,63,94,0.96)",
    secondary: "rgba(254,202,202,0.78)",
    glow: "rgba(220,38,38,0.48)",
    muted: "rgba(127,29,29,0.8)",
  },
  Amethyst: {
    primary: "rgba(168,85,247,0.98)",
    secondary: "rgba(233,213,255,0.82)",
    glow: "rgba(147,51,234,0.54)",
    muted: "rgba(88,28,135,0.82)",
  },
  Galaxy: {
    primary: "rgba(125,211,252,0.94)",
    secondary: "rgba(217,70,239,0.76)",
    glow: "rgba(59,130,246,0.42)",
    muted: "rgba(30,41,59,0.86)",
  },
};

const AiTierBackgroundCard = ({
  tier,
  imageUrl,
  overall,
  playerName,
}: {
  tier: AiArtTier;
  imageUrl: string;
  overall: number;
  playerName: string;
}) => {
  const styles = tierStyles[tier];
  const mineral = tierMineralBackgrounds[tier];
  const displayName = playerName.trim() || "AI Art Player";
  const nameWords = splitCardFaceName(displayName);
  const [firstName = "AI", ...lastNameWords] = nameWords;
  const lastName = lastNameWords.join(" ") || firstName;
  const team = getNbaTeamByName(testCardTeamName);
  const isGalaxy = tier === "Galaxy";
  const referencePalette = tierReferencePalettes[tier];
  const frameColor = isGalaxy ? "rgba(250,204,21,0.74)" : "rgba(251,191,36,0.66)";
  const spectacleGlow = isGalaxy
    ? "radial-gradient(ellipse at 50% 36%, rgba(14,165,233,0.34), transparent 28%), radial-gradient(ellipse at 64% 48%, rgba(217,70,239,0.34), transparent 32%), radial-gradient(ellipse at 38% 70%, rgba(251,191,36,0.14), transparent 28%)"
    : `radial-gradient(ellipse at 52% 34%, ${mineral.accent}, transparent 34%), radial-gradient(ellipse at 34% 68%, rgba(255,255,255,0.18), transparent 30%)`;
  const sparkleField = isGalaxy
    ? "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.95) 0 1px, transparent 1.5px), radial-gradient(circle at 82% 17%, rgba(125,211,252,0.95) 0 1px, transparent 1.5px), radial-gradient(circle at 66% 35%, rgba(255,255,255,0.84) 0 0.8px, transparent 1.4px), radial-gradient(circle at 28% 48%, rgba(244,114,182,0.82) 0 1px, transparent 1.6px), radial-gradient(circle at 74% 64%, rgba(255,255,255,0.86) 0 1px, transparent 1.5px), radial-gradient(circle at 42% 78%, rgba(125,211,252,0.78) 0 1px, transparent 1.5px), radial-gradient(circle at 88% 82%, rgba(255,255,255,0.7) 0 0.8px, transparent 1.4px)"
    : "radial-gradient(circle at 18% 24%, rgba(255,255,255,0.58) 0 1px, transparent 1.6px), radial-gradient(circle at 72% 18%, rgba(255,255,255,0.42) 0 1px, transparent 1.6px), radial-gradient(circle at 84% 54%, rgba(255,255,255,0.36) 0 0.8px, transparent 1.5px), radial-gradient(circle at 30% 76%, rgba(255,255,255,0.36) 0 0.8px, transparent 1.5px)";

  return (
    <div
      className={`relative overflow-hidden rounded-[2px] border-2 bg-slate-950 ${styles.border} ${styles.glow}`}
      style={{
        width: 224,
        aspectRatio: "0.645",
        clipPath: "polygon(7% 0, 93% 0, 100% 5%, 100% 95%, 93% 100%, 7% 100%, 0 95%, 0 5%)",
      }}
    >
      <div
        className="absolute inset-[3px] border"
        style={{
          borderColor: frameColor,
          clipPath: "polygon(7% 0, 93% 0, 100% 5%, 100% 95%, 93% 100%, 7% 100%, 0 95%, 0 5%)",
        }}
      />
      <div className="absolute inset-0" style={{ background: mineral.base }} />
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={`${tier} card background study`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),transparent_42%,rgba(0,0,0,0.5)_83%,rgba(0,0,0,0.82)_100%)]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-100" style={{ background: mineral.facets }} />
          <div className="absolute inset-0 opacity-95" style={{ background: mineral.veins }} />
          <div
            className="absolute -left-[16%] top-[8%] h-[28%] w-[126%] rotate-[-18deg] opacity-70 mix-blend-screen blur-[1px]"
            style={{
              background: isGalaxy
                ? "linear-gradient(90deg, transparent, rgba(125,211,252,0.2), rgba(217,70,239,0.22), transparent)"
                : `linear-gradient(90deg, transparent, ${mineral.accent}, rgba(255,255,255,0.22), transparent)`,
            }}
          />
          <div
            className="absolute -left-[22%] top-[18%] h-[18%] w-[128%] rotate-[-24deg] opacity-95 mix-blend-screen"
            style={{
              background: isGalaxy
                ? "linear-gradient(90deg, transparent, rgba(125,211,252,0.5), rgba(217,70,239,0.38), transparent)"
                : `linear-gradient(90deg, transparent, ${mineral.accent}, rgba(255,255,255,0.42), transparent)`,
              clipPath: "polygon(0 35%, 62% 0, 100% 54%, 38% 100%)",
            }}
          />
          <div
            className="absolute -right-[28%] top-[53%] h-[18%] w-[132%] rotate-[-22deg] opacity-72 mix-blend-screen"
            style={{
              background: isGalaxy
                ? "linear-gradient(90deg, transparent, rgba(244,114,182,0.45), rgba(251,191,36,0.2), transparent)"
                : `linear-gradient(90deg, transparent, rgba(255,255,255,0.24), ${mineral.accent}, transparent)`,
              clipPath: "polygon(0 48%, 72% 0, 100% 42%, 30% 100%)",
            }}
          />
          <div
            className="absolute -right-[26%] top-[34%] h-[34%] w-[120%] rotate-[26deg] opacity-56 mix-blend-screen blur-[1px]"
            style={{
              background: isGalaxy
                ? "linear-gradient(90deg, transparent, rgba(244,114,182,0.16), rgba(125,211,252,0.18), transparent)"
                : `linear-gradient(90deg, transparent, rgba(255,255,255,0.16), ${mineral.accent}, transparent)`,
            }}
          />
          <div
            className="absolute inset-x-[6%] top-[7%] h-[62%] opacity-90"
            style={{
              background: spectacleGlow,
              filter: "blur(18px)",
            }}
          />
          <div
            className="absolute left-[15%] top-[8%] h-[63%] w-[74%] opacity-55 shadow-[0_24px_70px_rgba(0,0,0,0.44)]"
            style={{
              background: mineral.crystal,
              clipPath: isGalaxy
                ? "polygon(50% 0, 76% 17%, 100% 42%, 84% 70%, 61% 100%, 28% 88%, 0 58%, 16% 22%)"
                : "polygon(48% 0, 78% 8%, 100% 32%, 88% 68%, 64% 100%, 25% 94%, 0 55%, 12% 18%)",
            }}
          />
          <div
            className="absolute left-[8%] top-[14%] h-[58%] w-[32%] opacity-95 mix-blend-screen"
            style={{
              background: mineral.brightShard,
              clipPath: "polygon(42% 0, 100% 20%, 66% 100%, 0 74%, 18% 18%)",
            }}
          />
          <div
            className="absolute right-[7%] top-[15%] h-[58%] w-[34%] opacity-86 mix-blend-screen"
            style={{
              background: mineral.brightShard,
              clipPath: "polygon(22% 0, 100% 12%, 82% 86%, 30% 100%, 0 38%)",
            }}
          />
          <div
            className="absolute left-[4%] top-[18%] h-[38%] w-[36%] opacity-92"
            style={{
              background: mineral.shard,
              clipPath: "polygon(46% 0, 100% 28%, 72% 100%, 12% 78%, 0 26%)",
            }}
          />
          <div
            className="absolute right-[2%] top-[26%] h-[44%] w-[34%] opacity-90"
            style={{
              background: mineral.shard,
              clipPath: "polygon(56% 0, 100% 44%, 64% 100%, 0 74%, 18% 18%)",
            }}
          />
          <div
            className="absolute bottom-[24%] left-[2%] h-[22%] w-[50%] opacity-76"
            style={{
              background: mineral.shard,
              clipPath: "polygon(0 38%, 75% 0, 100% 56%, 22% 100%)",
            }}
          />
          <div
            className="absolute bottom-[19%] right-[5%] h-[20%] w-[42%] opacity-74"
            style={{
              background: mineral.brightShard,
              clipPath: "polygon(14% 0, 100% 24%, 72% 100%, 0 64%)",
            }}
          />
          <div
            className="absolute left-[34%] top-[4%] h-[25%] w-[22%] opacity-88 mix-blend-screen"
            style={{
              background: isGalaxy
                ? "linear-gradient(160deg, rgba(255,255,255,0.5), rgba(125,211,252,0.16), transparent 76%)"
                : mineral.brightShard,
              clipPath: "polygon(50% 0, 100% 52%, 58% 100%, 0 42%)",
            }}
          />
          <div
            className="absolute right-[9%] top-[8%] h-[27%] w-[20%] opacity-64 mix-blend-screen"
            style={{
              background: isGalaxy
                ? "linear-gradient(145deg, rgba(217,70,239,0.44), rgba(125,211,252,0.12), transparent 78%)"
                : mineral.shard,
              clipPath: "polygon(22% 0, 100% 22%, 70% 100%, 0 68%)",
            }}
          />
          <div
            className="absolute -left-[9%] top-[18%] h-[58%] w-[34%] opacity-78 mix-blend-screen"
            style={{
              background: isGalaxy
                ? "linear-gradient(155deg, rgba(125,211,252,0.44), rgba(2,6,23,0.1) 62%, transparent)"
                : mineral.brightShard,
              clipPath: "polygon(0 18%, 70% 0, 100% 50%, 48% 100%, 8% 74%)",
            }}
          />
          <div
            className="absolute -right-[10%] top-[17%] h-[62%] w-[38%] opacity-78 mix-blend-screen"
            style={{
              background: isGalaxy
                ? "linear-gradient(205deg, rgba(217,70,239,0.46), rgba(14,165,233,0.14) 54%, transparent)"
                : mineral.brightShard,
              clipPath: "polygon(22% 0, 100% 18%, 86% 82%, 32% 100%, 0 46%)",
            }}
          />
          <div
            className="absolute inset-x-[4%] top-[23%] h-[42%] opacity-70 mix-blend-screen"
            style={{
              background: isGalaxy
                ? "conic-gradient(from 210deg at 50% 50%, transparent, rgba(125,211,252,0.18), rgba(217,70,239,0.22), transparent 58%)"
                : `conic-gradient(from 220deg at 50% 48%, transparent, ${mineral.accent}, rgba(255,255,255,0.28), transparent 62%)`,
              clipPath: "polygon(50% 0, 100% 34%, 78% 100%, 18% 88%, 0 28%)",
            }}
          />
          <div className="absolute inset-0 opacity-90 mix-blend-screen" style={{ background: sparkleField }} />
          <div
            className="absolute inset-x-[8%] top-[5%] h-[84%] opacity-80 mix-blend-screen"
            style={{
              background:
                "linear-gradient(118deg, transparent 0 11%, rgba(255,255,255,0.34) 12%, transparent 15% 31%, rgba(255,255,255,0.22) 32%, transparent 35% 58%, rgba(255,255,255,0.2) 59%, transparent 62% 100%)",
            }}
          />
          {isGalaxy ? (
            <>
              <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.9)_0_1px,transparent_1.5px),radial-gradient(circle_at_74%_26%,rgba(125,211,252,0.9)_0_1px,transparent_1.6px),radial-gradient(circle_at_42%_54%,rgba(255,255,255,0.7)_0_1px,transparent_1.5px),radial-gradient(circle_at_84%_68%,rgba(244,114,182,0.8)_0_1px,transparent_1.6px),radial-gradient(circle_at_26%_76%,rgba(255,255,255,0.58)_0_0.8px,transparent_1.4px)]" />
              <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_65%_42%,rgba(255,255,255,0.72)_0_0.7px,transparent_1.4px),radial-gradient(circle_at_36%_30%,rgba(125,211,252,0.62)_0_0.8px,transparent_1.5px),radial-gradient(circle_at_58%_82%,rgba(255,255,255,0.5)_0_0.7px,transparent_1.4px)]" />
            </>
          ) : null}
          <div
            className="absolute inset-x-[8%] top-[7%] h-[78%] opacity-70 mix-blend-screen"
            style={{
              background:
                "linear-gradient(108deg, transparent 0 16%, rgba(255,255,255,0.28) 17%, transparent 20% 42%, rgba(255,255,255,0.18) 43%, transparent 46% 100%)",
            }}
          />
          <div
            className="absolute inset-x-[8%] top-[8%] h-[76%] opacity-55 mix-blend-screen"
            style={{
              background:
                "linear-gradient(62deg, transparent 0 24%, rgba(255,255,255,0.22) 25%, transparent 28% 58%, rgba(255,255,255,0.18) 59%, transparent 62% 100%)",
            }}
          />
          <div className="absolute inset-0 bg-black/68" />
          <div
            className="absolute inset-0"
            style={{
              background: isGalaxy
                ? "radial-gradient(ellipse at 64% 18%, rgba(125,211,252,0.2), transparent 24%), radial-gradient(ellipse at 38% 56%, rgba(217,70,239,0.2), transparent 34%), linear-gradient(180deg, rgba(2,6,23,0.18), rgba(0,0,0,0.72))"
                : `radial-gradient(ellipse at 70% 28%, ${referencePalette.glow}, transparent 28%), radial-gradient(ellipse at 34% 58%, ${referencePalette.glow}, transparent 34%), linear-gradient(180deg, rgba(0,0,0,0.14), rgba(0,0,0,0.72))`,
            }}
          />
          <div
            className="absolute -left-[18%] top-[7%] h-[62%] w-[54%] opacity-95 mix-blend-screen"
            style={{
              background: `linear-gradient(145deg, transparent 0 10%, ${referencePalette.secondary} 11% 16%, transparent 17% 24%, ${referencePalette.primary} 25% 33%, transparent 34% 44%, ${referencePalette.secondary} 45% 52%, transparent 53% 100%)`,
              clipPath: "polygon(36% 0, 72% 4%, 100% 22%, 72% 100%, 22% 88%, 0 44%)",
            }}
          />
          <div
            className="absolute left-[8%] top-[16%] h-[56%] w-[22%] opacity-90 mix-blend-screen"
            style={{
              background: `linear-gradient(160deg, ${referencePalette.secondary}, ${referencePalette.primary} 38%, rgba(0,0,0,0.05) 78%)`,
              clipPath: "polygon(42% 0, 100% 20%, 72% 100%, 0 78%, 18% 28%)",
            }}
          />
          <div
            className="absolute left-[18%] top-[31%] h-[42%] w-[18%] opacity-82 mix-blend-screen"
            style={{
              background: `linear-gradient(155deg, ${referencePalette.secondary}, ${referencePalette.primary} 44%, transparent 84%)`,
              clipPath: "polygon(30% 0, 100% 28%, 76% 100%, 0 70%)",
            }}
          />
          <div
            className="absolute right-[-8%] top-[10%] h-[66%] w-[46%] opacity-95 mix-blend-screen"
            style={{
              background: `linear-gradient(212deg, transparent 0 10%, ${referencePalette.secondary} 11% 17%, transparent 18% 28%, ${referencePalette.primary} 29% 40%, transparent 41% 54%, ${referencePalette.secondary} 55% 62%, transparent 63% 100%)`,
              clipPath: "polygon(28% 0, 84% 8%, 100% 48%, 68% 100%, 14% 88%, 0 34%)",
            }}
          />
          <div
            className="absolute right-[9%] top-[24%] h-[48%] w-[24%] opacity-88 mix-blend-screen"
            style={{
              background: `linear-gradient(205deg, ${referencePalette.secondary}, ${referencePalette.primary} 42%, transparent 82%)`,
              clipPath: "polygon(22% 0, 100% 18%, 74% 100%, 0 74%)",
            }}
          />
          <div
            className="absolute -left-[16%] top-[30%] h-[16%] w-[132%] rotate-[-24deg] opacity-88 mix-blend-screen"
            style={{
              background: `linear-gradient(90deg, transparent, ${referencePalette.primary}, rgba(255,255,255,0.22), transparent)`,
              clipPath: "polygon(0 42%, 76% 0, 100% 44%, 22% 100%)",
            }}
          />
          <div
            className="absolute -right-[18%] top-[49%] h-[15%] w-[118%] rotate-[-18deg] opacity-72 mix-blend-screen"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.18), ${referencePalette.primary}, transparent)`,
              clipPath: "polygon(0 48%, 72% 0, 100% 44%, 24% 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-80 mix-blend-screen"
            style={{
              background: isGalaxy
                ? "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.9) 0 0.9px, transparent 1.5px), radial-gradient(circle at 74% 24%, rgba(125,211,252,0.86) 0 1px, transparent 1.6px), radial-gradient(circle at 82% 58%, rgba(217,70,239,0.8) 0 1px, transparent 1.5px), radial-gradient(circle at 38% 72%, rgba(255,255,255,0.72) 0 0.8px, transparent 1.4px)"
                : `radial-gradient(circle at 22% 24%, ${referencePalette.secondary} 0 0.8px, transparent 1.4px), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.62) 0 0.9px, transparent 1.5px), radial-gradient(circle at 82% 62%, ${referencePalette.secondary} 0 0.8px, transparent 1.4px), radial-gradient(circle at 34% 74%, rgba(255,255,255,0.54) 0 0.8px, transparent 1.4px)`,
            }}
          />
          <div
            className="absolute right-[8%] top-[6%] h-[18%] w-[28%] opacity-22"
            style={{
              background: isGalaxy
                ? "linear-gradient(135deg, rgba(125,211,252,0.7), transparent)"
                : `linear-gradient(135deg, ${referencePalette.primary}, transparent)`,
              clipPath: "polygon(8% 0, 100% 0, 82% 86%, 0 100%)",
            }}
          />
        </>
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.02),transparent_32%,rgba(2,6,23,0.22)_60%,rgba(2,6,23,0.96)_100%)]" />
      <div
        className="absolute inset-[4px] pointer-events-none"
        style={{
          clipPath: "polygon(7% 0, 93% 0, 100% 5%, 100% 95%, 93% 100%, 7% 100%, 0 95%, 0 5%)",
          boxShadow: `inset 0 0 0 1px ${frameColor}, inset 0 0 22px rgba(251,191,36,0.12)`,
        }}
      />
      <div className="absolute inset-x-[12%] top-[5%] h-px" style={{ background: frameColor }} />
      <div className="absolute left-0 top-0 rounded-br-[18px] bg-black/62 px-3 pb-2 pt-2 shadow-[0_10px_24px_rgba(0,0,0,0.34)] backdrop-blur-[2px]">
        <div className="text-center font-display text-[2.38rem] font-black leading-[0.82] text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.45)]">
          {overall}
        </div>
        <div className="mt-1 text-center text-[0.6rem] font-black uppercase tracking-[0.12em] text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">
          {testCardPositions}
        </div>
      </div>
      <div className="absolute right-1 top-1 flex flex-col items-center gap-1.5">
        {team?.logo ? (
          <div
            className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-bl-[18px] border border-white/15 bg-black/62 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.4)] backdrop-blur-[2px]"
            title={`${team.name} logo: this card's team identity for chemistry and coach links.`}
          >
            <img
              src={team.logo}
              alt={`${team.name} logo`}
              className="h-full w-full object-contain"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : null}
        <div
          className="flex h-5 w-5 items-center justify-center rounded-full border border-lime-200/70 bg-lime-300/20 text-lime-100 shadow-[0_0_10px_rgba(190,242,100,0.3)] backdrop-blur-[2px]"
          title="Coach Link: this player matches the coach's associated team and can receive the coach run boost."
        >
          <Handshake size={11} strokeWidth={2.5} />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-[31%] px-5 text-center">
        <div className="absolute inset-x-5 top-[41%] h-[40%] -rotate-2 bg-black/72 blur-[1px]" />
        <div
          className="relative font-display font-black uppercase tracking-[0.22em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.86)]"
          style={{ color: mineral.accent, fontSize: getFittedNameWordSize(firstName, 0.9, 0.48, 5.1) }}
        >
          {firstName}
        </div>
        <div className="relative mx-auto my-[3px] h-px w-[64%]" style={{ background: mineral.accent }} />
        <div
          className="relative mx-auto block max-w-full whitespace-nowrap font-display font-black uppercase italic leading-[0.86] text-white drop-shadow-[0_7px_16px_rgba(0,0,0,0.9)]"
          style={{ fontSize: getFittedNameWordSize(lastName, 1.7, 0.52, 8.25) }}
        >
          {lastName}
        </div>
      </div>
      <div className="absolute inset-x-4 bottom-[2.7%] border-t border-white/10 bg-black/18 pt-1.5 backdrop-blur-[1px]">
        <div className="flex justify-center gap-2">
          {testCardBadges.map((badge) => (
            <div
              key={`type-${tier}-${badge.type}`}
              className={`flex h-5 w-5 items-center justify-center border ${playerTypeBadgeStyleClass[badge.type]}`}
              style={{ clipPath: "polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0 50%)" }}
              title={`${badge.label}: ${badge.detail}`}
            >
              {renderPlayerTypeBadgeIcon(badge.type, true)}
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-center gap-2">
          {testChemistryBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={`chemistry-${tier}-${badge.label}`}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-100/55 bg-cyan-200/16 text-cyan-50 shadow-[0_0_12px_rgba(125,211,252,0.22)]"
                title={`${badge.label}: ${badge.detail}`}
              >
                <Icon size={11} strokeWidth={2.3} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AiArtPreviewCard = ({
  tier,
  playerName,
  overall,
  imageUrl,
  compact = false,
}: {
  tier: AiArtTier;
  playerName: string;
  overall: number;
  imageUrl: string;
  compact?: boolean;
}) => {
  const styles = tierStyles[tier];
  const team = getNbaTeamByName(testCardTeamName);
  const displayName = playerName.trim() || "AI Art Player";
  const nameWords = splitCardFaceName(displayName.replace(/\s*\([^)]*\)\s*$/, ""));
  const cardWidth = compact ? 176 : 332;

  return (
    <div
      className={`relative overflow-hidden rounded-[2px] border-2 bg-slate-950 ${styles.border} ${styles.glow}`}
      style={{
        width: cardWidth,
        aspectRatio: "0.645",
        clipPath: "polygon(7% 0, 93% 0, 100% 5%, 100% 95%, 93% 100%, 7% 100%, 0 95%, 0 5%)",
      }}
    >
      <div className="absolute inset-[3px] border border-amber-200/38" style={{ clipPath: "polygon(7% 0, 93% 0, 100% 5%, 100% 95%, 93% 100%, 7% 100%, 0 95%, 0 5%)" }} />
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.backdrop}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_18%,rgba(255,255,255,0.16),transparent_20%),linear-gradient(115deg,transparent_0%,rgba(168,85,247,0.2)_28%,transparent_44%,rgba(251,191,36,0.16)_56%,transparent_72%)]" />
      <div className="absolute inset-0 opacity-70 [background-image:repeating-linear-gradient(115deg,transparent_0px,transparent_13px,rgba(168,85,247,0.24)_14px,rgba(168,85,247,0.24)_17px,transparent_19px),repeating-linear-gradient(145deg,transparent_0px,transparent_22px,rgba(245,158,11,0.12)_24px,rgba(245,158,11,0.12)_27px,transparent_29px)]" />
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${displayName} ${tier} AI art`}
          className="absolute inset-0 h-full w-full object-cover object-top"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-x-[18%] top-[12%] h-[52%] rounded-t-full bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(168,85,247,0.52)_38%,rgba(24,24,27,0.88)_72%)] shadow-[0_20px_60px_rgba(0,0,0,0.42)]" />
      )}
      <div className="absolute left-[45%] top-[5%] h-[18%] w-[34%] rounded-full border border-violet-200/10 bg-[radial-gradient(circle,rgba(168,85,247,0.22),transparent_65%)]" />
      <div className="absolute right-[9%] top-[9%] text-[4.6rem] font-black leading-none text-white/[0.045]">
        SA
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),transparent_34%,rgba(2,6,23,0.28)_62%,rgba(2,6,23,0.96)_100%)]" />

      <div className="absolute left-4 top-4 z-10">
        <div className={compact ? "font-display text-[2.65rem] font-black leading-[0.82] text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.45)]" : "font-display text-[4.2rem] font-black leading-[0.82] text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.45)]"}>
          {overall}
        </div>
        <div className={compact ? "mt-1 text-[0.72rem] font-black uppercase tracking-[0.14em] text-white" : "mt-2 text-[1rem] font-black uppercase tracking-[0.16em] text-white"}>
          {testCardPositions}
        </div>
        <div className={compact ? "mt-1 text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-amber-300" : "mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-amber-300"}>
          {testCardArchetype}
        </div>
        {team?.logo ? (
          <div className={compact ? "mt-2 h-7 w-7 opacity-95" : "mt-3 h-10 w-10 opacity-95"}>
            <img src={team.logo} alt={`${team.name} logo`} className="h-full w-full object-contain" loading="lazy" referrerPolicy="no-referrer" />
          </div>
        ) : null}
      </div>

      <div className="absolute left-4 top-[36%] z-10 flex flex-col gap-2">
        {testCardBadges.map((badge) => (
          <div
            key={badge.type}
            className={`flex items-center justify-center border bg-black/50 text-white shadow-[0_8px_18px_rgba(0,0,0,0.35)] backdrop-blur-[3px] ${playerTypeBadgeStyleClass[badge.type]}`}
            style={{
              width: compact ? 24 : 34,
              height: compact ? 24 : 34,
              clipPath: "polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0 50%)",
            }}
            title={badge.label}
          >
            {renderPlayerTypeBadgeIcon(badge.type, compact)}
          </div>
        ))}
      </div>

      <div className="absolute right-4 top-[27%] z-10 max-w-[34%] text-right">
        <div className={compact ? "font-display text-[0.9rem] font-black uppercase leading-[0.95] tracking-[0.04em] text-violet-300" : "font-display text-[1.45rem] font-black uppercase leading-[0.95] tracking-[0.05em] text-violet-300"}>
          Alien
          <br />
          Arrival
        </div>
        <div className={compact ? "mt-2 text-[0.46rem] leading-[1.35] text-white/78" : "mt-4 text-[0.66rem] leading-[1.45] text-white/78"}>
          Rim shadow, impossible release point, and floor-spacing gravity.
        </div>
      </div>

      <div className="absolute right-4 top-4 z-10">
        <div className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${styles.pill}`}>
          {tier}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[19%] z-10 px-5 text-center">
        <div className="font-display font-black uppercase italic leading-[0.88] text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.9)]">
          {nameWords.map((word, index) => (
            <div
              key={`${word}-${index}`}
              className="mx-auto block max-w-full whitespace-nowrap"
              style={{
                fontSize: getFittedNameWordSize(word, compact ? 1.3 : 2.55, compact ? 0.5 : 0.86, compact ? 6.45 : 13.6),
              }}
            >
              {word}
            </div>
          ))}
        </div>
        <div className={compact ? "mt-1 text-[0.48rem] font-semibold uppercase tracking-[0.18em] text-amber-300" : "mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-amber-300"}>
          San Antonio Spurs
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-[2.8%] z-10 grid grid-cols-2 gap-2">
        {testCardBadges.slice(0, compact ? 0 : 2).map((badge) => (
          <div key={badge.type} className="grid grid-cols-[30px_minmax(0,1fr)] gap-2 border border-white/10 bg-black/48 p-2">
            <div
              className={`flex h-7 w-7 items-center justify-center border ${playerTypeBadgeStyleClass[badge.type]}`}
              style={{ clipPath: "polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0 50%)" }}
            >
              {renderPlayerTypeBadgeIcon(badge.type, true)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[0.58rem] font-black uppercase tracking-[0.08em] text-amber-300">
                {badge.label}
              </div>
              <div className="mt-0.5 line-clamp-2 text-[0.54rem] leading-[1.15] text-white/78">
                {badge.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!imageUrl ? (
        <div className="absolute right-4 bottom-[31%] z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-white/54">
          <Image size={compact ? 9 : 12} />
          Image slot
        </div>
      ) : null}
    </div>
  );
};

const AiGeneratedPlayerCard = ({
  player,
  artUrl,
  scale = 1,
}: {
  player: Player;
  artUrl?: string;
  scale?: number;
}) => {
  const tier = getPlayerTier(player) as AiArtTier;
  const styles = tierStyles[tier];
  const mineral = tierMineralBackgrounds[tier];
  const team = getNbaTeamByName(player.teamLabel);
  const displayName = getCleanPlayerName(player.name);
  const nameWords = splitCardFaceName(displayName);
  const [firstName = "AI", ...lastNameWords] = nameWords;
  const lastName = lastNameWords.join(" ") || firstName;
  const naturalPositions = [player.primaryPosition, ...player.secondaryPositions].join("/");
  const playerTypeBadges = getPlayerTypeBadges(player);
  const backgroundUrl = defaultBackgroundUrls[tier] || defaultBackgroundUrls.Emerald;
  const frameColor = "rgba(251,191,36,0.68)";
  const referenceImage = getAiCardReferenceImage(player);
  const displayArtUrl = artUrl ?? referenceImage ?? "";
  const hasGeneratedArt = Boolean(artUrl);
  const cardWidth = 332;
  const cardHeight = cardWidth / 0.645;

  return (
    <div
      style={{
        width: cardWidth * scale,
        height: cardHeight * scale,
      }}
    >
    <div
      className={`relative overflow-hidden rounded-[2px] border-2 bg-slate-950 ${styles.border} ${styles.glow}`}
      style={{
        width: cardWidth,
        aspectRatio: "0.645",
        clipPath: "polygon(7% 0, 93% 0, 100% 5%, 100% 95%, 93% 100%, 7% 100%, 0 95%, 0 5%)",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <img
        src={backgroundUrl}
        alt={`${tier} AI card background`}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.03),transparent_38%,rgba(2,6,23,0.26)_62%,rgba(2,6,23,0.9)_100%)]" />
      <div
        className="absolute inset-[4px] pointer-events-none"
        style={{
          clipPath: "polygon(7% 0, 93% 0, 100% 5%, 100% 95%, 93% 100%, 7% 100%, 0 95%, 0 5%)",
          boxShadow: `inset 0 0 0 1px ${frameColor}, inset 0 0 28px rgba(251,191,36,0.13)`,
        }}
      />
      <div className="absolute inset-x-[12%] top-[5%] h-px" style={{ background: frameColor }} />

      <div className="absolute left-4 top-0 z-20 rounded-b-[18px] bg-black/68 px-3.5 pb-2.5 pt-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.4)] backdrop-blur-[2px]">
        <div className="text-center font-display text-[3.2rem] font-black leading-[0.82] text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.45)]">
          {player.overall}
        </div>
        <div className="mt-1.5 text-center text-[0.74rem] font-black uppercase tracking-[0.13em] text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">
          {naturalPositions}
        </div>
      </div>

      <div className="absolute right-4 top-0 z-20 flex flex-col items-center gap-1.5">
        {team?.logo ? (
          <div
            className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-bl-[18px] border border-white/15 bg-black/62 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.4)] backdrop-blur-[2px]"
            title={`${team.name} logo: team identity for chemistry and coach links.`}
          >
            <img src={team.logo} alt={`${team.name} logo`} className="h-full w-full object-contain" loading="lazy" />
          </div>
        ) : null}
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full border border-lime-200/70 bg-lime-300/20 text-lime-100 shadow-[0_0_12px_rgba(190,242,100,0.32)] backdrop-blur-[2px]"
          title="Coach Link: this icon lights up when the player matches the coach's associated team."
        >
          <Handshake size={13} strokeWidth={2.5} />
        </div>
      </div>

      {displayArtUrl ? (
        <img
          src={displayArtUrl}
          alt={`${displayName} ${hasGeneratedArt ? "AI-generated player art" : "reference player image"}`}
          className={`absolute z-10 max-w-none object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.52)] ${
            hasGeneratedArt ? "h-[70%]" : "h-[58%] opacity-90 mix-blend-screen"
          }`}
          style={hasGeneratedArt ? { left: "-12%", bottom: "22%", width: "124%" } : { left: "3%", bottom: "32%", width: "94%" }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-x-[23%] top-[24%] z-10 flex h-[36%] items-center justify-center rounded-t-full border border-white/10 bg-black/38 text-center text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/58 shadow-[0_18px_34px_rgba(0,0,0,0.36)] backdrop-blur-[2px]">
          Art
          <br />
          Pending
        </div>
      )}

      <div className="absolute inset-x-4 bottom-[18%] z-30 rounded-[18px] border border-white/10 bg-black/72 px-4 py-3 text-center shadow-[0_14px_34px_rgba(0,0,0,0.48)] backdrop-blur-[2px]">
        <div className="absolute inset-x-3 top-[46%] h-[34%] -rotate-2 bg-black/80 blur-[2px]" />
        <div
          className="relative font-display font-black uppercase tracking-[0.22em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.86)]"
          style={{ color: mineral.accent, fontSize: getFittedNameWordSize(firstName, 1.08, 0.6, 6.7) }}
        >
          {firstName}
        </div>
        <div className="relative mx-auto my-2 h-px w-[76%]" style={{ background: mineral.accent }} />
        <div
          className="relative mx-auto block max-w-full whitespace-nowrap font-display font-black uppercase italic leading-[0.86] text-white drop-shadow-[0_7px_16px_rgba(0,0,0,0.9)]"
          style={{ fontSize: getFittedNameWordSize(lastName, 2.2, 0.72, 12.2) }}
        >
          {lastName}
        </div>
        <div className="relative mt-2 text-[0.66rem] font-black uppercase tracking-[0.22em] text-emerald-100 drop-shadow-[0_3px_10px_rgba(0,0,0,0.75)]">
          {player.teamLabel}
        </div>
      </div>

      <div className="absolute inset-x-6 bottom-[3.2%] z-30 border-t border-white/12 bg-black/24 pt-2 backdrop-blur-[1px]">
        <div className="flex justify-center gap-2.5">
          {playerTypeBadges.map((badge) => (
            <div
              key={`generated-${player.id}-${badge.type}`}
              className={`flex h-8 w-8 items-center justify-center border ${playerTypeBadgeStyleClass[badge.type]}`}
              style={{ clipPath: "polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0 50%)" }}
              title={`${badge.label}: ${badge.description}`}
            >
              {renderPlayerTypeBadgeIcon(badge.type, false)}
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};

export const CardLabAiArtCards = () => {
  const [activeTab, setActiveTab] = useState<AiArtTab>("Preview Lab");
  const [selectedTier, setSelectedTier] = useState<AiArtTier>("Amethyst");
  const [selectedPreviewSurface, setSelectedPreviewSurface] = useState<AiPreviewSurface>("Full Art Card");
  const playerName = testCardPlayerName;
  const overall = testCardOverall;
  const imageUrls = defaultImageUrls;
  const [backgroundImageUrls] = useState<Record<AiArtTier, string>>(defaultBackgroundUrls);
  const andreJacksonPlayer = allPlayers.find((player) => player.id === "andre-jackson-jr-2025-26");
  const andreJacksonBadges = andreJacksonPlayer ? getPlayerTypeBadges(andreJacksonPlayer) : [];
  const andreJacksonArtRecord = andreJacksonPlayer ? getAiCardArtRecord(andreJacksonPlayer) : null;
  const andreJacksonReferenceImage = andreJacksonPlayer ? getAiCardReferenceImage(andreJacksonPlayer) : null;
  const launchPlayersByTier = useMemo(() => getAiCardLaunchPlayersByTier(), []);
  const launchPlayerCount = aiArtTiers.reduce((count, tier) => count + launchPlayersByTier[tier].length, 0);
  const generatedLaunchArtCount = aiArtTiers.reduce(
    (count, tier) =>
      count + launchPlayersByTier[tier].filter((player) => getAiCardGeneratedCutout(player)).length,
    0,
  );
  const referenceReadyLaunchCount = aiArtTiers.reduce(
    (count, tier) =>
      count + launchPlayersByTier[tier].filter((player) => getAiCardReferenceImage(player)).length,
    0,
  );

  const selectedImageUrl = imageUrls[selectedTier];
  const populatedTierCount = useMemo(
    () => aiArtTiers.filter((tier) => imageUrls[tier].trim()).length,
    [imageUrls],
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Isolated Lab</div>
            <h2 className="mt-2 font-display text-3xl text-white">AI Art Cards</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              A separate sandbox for full-art AI card direction, tier treatment, image readability, and style notes.
            </p>
          </div>
          <div className="rounded-full border border-sky-300/18 bg-sky-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-100">
            {populatedTierCount}/{aiArtTiers.length} tiers filled
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {aiArtTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                activeTab === tab
                  ? "border-white/20 bg-white text-slate-950"
                  : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Preview Lab" ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4 rounded-[26px] border border-white/10 bg-black/18 p-4">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Tier Preview</div>
              <div className="grid grid-cols-2 gap-2">
                {aiArtTiers.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`rounded-2xl border px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      selectedTier === tier
                        ? "border-white/20 bg-white text-slate-950"
                        : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Preview Surface</div>
              <div className="grid gap-2">
                {aiPreviewSurfaces.map((surface) => (
                  <button
                    key={surface}
                    type="button"
                    onClick={() => setSelectedPreviewSurface(surface)}
                    className={`rounded-2xl border px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      selectedPreviewSurface === surface
                        ? "border-white/20 bg-white text-slate-950"
                        : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {surface}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/6 p-4 text-xs leading-5 text-slate-300">
              <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Locked Test Card</div>
              <div className="mt-2 text-white">{testCardPlayerName}</div>
              <div className="mt-1 text-slate-400">
                {testCardOverall} OVR / {testCardPositions} / {testCardTeamName}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <div className="flex justify-center">
              {selectedPreviewSurface === "Full Art Card" ? (
                <AiArtPreviewCard
                  tier={selectedTier}
                  playerName={playerName}
                  overall={overall}
                  imageUrl={selectedImageUrl}
                />
              ) : (
                <AiTierBackgroundCard
                  tier={selectedTier}
                  imageUrl={backgroundImageUrls[selectedTier]}
                  overall={overall}
                  playerName={playerName}
                />
              )}
            </div>
            <div className="rounded-[26px] border border-white/10 bg-black/18 p-4">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Preview Checklist</div>
              <h3 className="mt-2 font-display text-2xl text-white">{selectedTier} {selectedPreviewSurface}</h3>
              <div className="mt-4 rounded-[22px] border border-white/10 bg-white/6 p-4 text-sm leading-6 text-slate-300">
                Use the selectors to inspect tier treatment, full-art readability, background-card composition, compact previews, and mobile grid behavior without editing source data from the page.
              </div>
              <div className="mt-4 grid gap-2 text-xs leading-5 text-slate-300 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                  <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Pose</div>
                  <div className="mt-1">Readable action and face shape at small sizes.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                  <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Tier</div>
                  <div className="mt-1">Color identity should read without overpowering art.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                  <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Style</div>
                  <div className="mt-1">Premium, consistent, and not too noisy behind text.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="rounded-[26px] border border-white/10 bg-black/18 p-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Player Cards</div>
                  <h3 className="mt-2 font-display text-2xl text-white">25-card launch review grid</h3>
                  <div className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
                    Five real player-pool cards per tier, using live ratings, teams, natural positions, tier backgrounds, and derived player type badges. Each card uses its existing player-card image as the default AI reference source, then swaps to a generated cutout when one is available.
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {generatedLaunchArtCount}/{launchPlayerCount} art assets ready
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs leading-5 text-slate-300 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                  <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Data Source</div>
                  <div className="mt-1">All cards are selected from the existing player pool.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                  <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Current Asset State</div>
                  <div className="mt-1">{referenceReadyLaunchCount}/{launchPlayerCount} cards have existing player-card images ready as likeness references.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                  <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Next Production Pass</div>
                  <div className="mt-1">Generate likeness-accurate player art and real-uniform cutouts tier by tier.</div>
                </div>
              </div>
            </div>

            {aiArtTiers.map((tier) => (
              <section key={`ai-player-grid-${tier}`} className="rounded-[26px] border border-white/10 bg-black/18 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{tier} Tier</div>
                    <h4 className="mt-1 font-display text-xl text-white">5 {tier} player cards</h4>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    {launchPlayersByTier[tier].filter((player) => getAiCardGeneratedCutout(player)).length}/5 generated
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {launchPlayersByTier[tier].map((player) => {
                    const generatedCutout = getAiCardGeneratedCutout(player);
                    const referenceImage = getAiCardReferenceImage(player);
                    const status = getAiCardArtStatus(player);
                    const artRecord = getAiCardArtRecord(player);

                    return (
                      <div key={`ai-player-card-${player.id}`} className="flex min-w-0 flex-col items-center gap-3 overflow-hidden rounded-[24px] border border-white/10 bg-white/6 p-3">
                        <AiGeneratedPlayerCard player={player} artUrl={generatedCutout ?? undefined} scale={0.62} />
                        <div className="w-full text-center">
                          <div className="text-sm font-semibold text-white">{getCleanPlayerName(player.name)}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            {player.overall} OVR / {player.teamLabel}
                          </div>
                        </div>
                        <div className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-black/24 p-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/6">
                            {referenceImage ? (
                              <img
                                src={referenceImage}
                                alt={`${getCleanPlayerName(player.name)} source reference`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Image size={14} className="text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div
                              className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-300"
                              title={aiCardArtStatusDetails[status]}
                            >
                              {aiCardArtStatusLabels[status]}
                            </div>
                            <div className="mt-0.5 truncate text-[9px] uppercase tracking-[0.12em] text-slate-500">
                              {referenceImage ? "Current card image reference" : "Reference missing"}
                            </div>
                          </div>
                        </div>
                        {artRecord?.notes ? (
                          <div className="line-clamp-2 w-full text-center text-[10px] leading-4 text-slate-500">
                            {artRecord.notes}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {andreJacksonPlayer ? (
              <div className="rounded-[26px] border border-white/10 bg-black/18 p-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Generated Asset Detail</div>
                <h3 className="mt-2 font-display text-2xl text-white">Andre Jackson Jr.</h3>
                <div className="mt-4 grid gap-2 text-xs leading-5 text-slate-300 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                    <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Player Pool Data</div>
                    <div className="mt-1 text-white">{andreJacksonPlayer.overall} OVR / {getPlayerTier(andreJacksonPlayer)} / {andreJacksonPlayer.primaryPosition}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                    <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Player Type Badges</div>
                    <div className="mt-1 text-white">
                      {andreJacksonBadges.length ? andreJacksonBadges.map((badge) => badge.label).join(" / ") : "None"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                    <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Art Asset</div>
                    <div className="mt-1 break-all text-white">
                      {andreJacksonArtRecord?.generatedCutoutUrl ?? "No generated cutout yet"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                    <div className="font-semibold uppercase tracking-[0.16em] text-slate-400">Reference Source</div>
                    <div className="mt-1 break-all text-white">
                      {andreJacksonReferenceImage ?? "No existing card image found"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Approved References</div>
            <h2 className="mt-2 font-display text-2xl text-white">Locked card direction</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Saved visual benchmarks for Rogue card design decisions before we build the next production card.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            {approvedReferenceCards.length} reference saved
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {approvedReferenceCards.map((card) => (
            <div key={card.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/6 p-3">
              <div className="flex justify-center rounded-[18px] border border-white/10 bg-black/28 p-3">
                <img
                  src={card.imageUrl}
                  alt={`${card.title} approved AI card reference`}
                  className="max-h-[520px] w-auto rounded-[14px] object-contain shadow-[0_18px_38px_rgba(0,0,0,0.4)]"
                  loading="lazy"
                />
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm font-semibold text-white">{card.title}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">{card.subtitle}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">{card.details}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {activeTab === "Preview Lab" ? (
      <>
      <section className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Background Workshop</div>
            <h2 className="mt-2 font-display text-2xl text-white">Tier card backgrounds</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Background-only studies for each tier before player art, logos, and live card text are layered on top.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            5 tier backgrounds
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {aiArtTiers.map((tier) => (
            <div key={tier} className="rounded-[24px] border border-white/10 bg-white/6 p-3">
              <div className="flex justify-center">
                <AiTierBackgroundCard
                  tier={tier}
                  imageUrl={backgroundImageUrls[tier]}
                  overall={overall}
                  playerName={playerName}
                />
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm font-semibold text-white">{tier}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  {backgroundImageUrls[tier] ? "Background loaded" : "Generated placeholder"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      </>
      ) : null}

      <section className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Comparison Grid</div>
            <h2 className="mt-2 font-display text-2xl text-white">One card per tier</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Side-by-side generation check
          </div>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {aiArtTiers.map((tier) => (
            <div key={tier} className="flex flex-col items-center gap-3">
              <div className="text-center">
                <div className="text-sm font-semibold text-white">{tier}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  {imageUrls[tier] ? "Image loaded" : "Placeholder"}
                </div>
              </div>
              <AiArtPreviewCard tier={tier} playerName={playerName} overall={overall} imageUrl={imageUrls[tier]} compact />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Compact Check</div>
          <h2 className="mt-2 font-display text-2xl text-white">Small-size readability</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-4">
            {aiArtTiers.map((tier) => (
              <AiArtPreviewCard key={tier} tier={tier} playerName={playerName} overall={overall} imageUrl={imageUrls[tier]} compact />
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Mobile Grid</div>
          <h2 className="mt-2 font-display text-2xl text-white">Card-grid readability</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {aiArtTiers.map((tier) => (
              <div key={tier} className="flex justify-center rounded-[22px] border border-white/10 bg-white/6 p-3">
                <AiArtPreviewCard tier={tier} playerName={playerName} overall={overall} imageUrl={imageUrls[tier]} compact />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
