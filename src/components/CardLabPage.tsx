import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ClipboardCheck, Handshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import { CardLabAltPlayerCardV1 } from "./CardLabAltPlayerCardV1";
import { CardLabAltPlayerCardV2 } from "./CardLabAltPlayerCardV2";
import { CardLabAltPlayerCardV3 } from "./CardLabAltPlayerCard";
import { CardLabCoachCard } from "./CardLabCoachCard";
import { CardLabCoachRunRosterCard } from "./CardLabCoachRunRosterCard";
import { CardLabRunRosterCard } from "./CardLabRunRosterCard";
import type { CardHoloVariant } from "./CardHoloOverlay";
import { DraftPlayerCard } from "./DraftPlayerCard";
import {
  beforeTheGlorySections,
  cardLabCompactPreviewPlayers,
  cardLabFocusPlayers,
  cardLabMockCards,
  coachCardSections,
  getCardLabBadgeDefinitions,
} from "../lib/cardLab";
import { LegacyPlayerTier, PlayerTier } from "../types";
import { PlayerTypeBadge } from "../lib/playerTypeBadges";

type LabRarity = PlayerTier | LegacyPlayerTier | "Pink Smoke" | "Neon Paint" | "Black/Gold Marble";
type CardLabLine = "main-sandbox" | "before-the-glory" | "coaches";

const rarityOptions: LabRarity[] = [
  "S",
  "A",
  "B",
  "C",
  "D",
  "Galaxy",
  "Pink Smoke",
  "Neon Paint",
  "Black/Gold Marble",
  "Amethyst",
  "Emerald",
  "Ruby",
  "Sapphire",
];

const badgeTypeOptions: Array<{ value: PlayerTypeBadge; label: string }> = [
  { value: "sniper", label: "Sniper" },
  { value: "board-man", label: "Board Man" },
  { value: "playmaker", label: "Play Maker" },
  { value: "lockdown", label: "Lockdown" },
  { value: "slasher", label: "Slasher" },
];

const controlButtonClass =
  "rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition";

const holoVariantCards: Array<{
  id: CardHoloVariant;
  label: string;
  description: string;
}> = [
  { id: "prism", label: "Holo V1", description: "Balanced prismatic foil" },
  { id: "frame", label: "Holo V2", description: "Edge-loaded rainbow frame" },
  { id: "flash", label: "Holo V3", description: "Maximum foil flash" },
  { id: "frame-soft", label: "Holo V4", description: "Premium clean edge frame" },
  { id: "frame-vivid", label: "Holo V5", description: "Stronger V2-style frame" },
  { id: "frame-spectrum", label: "Holo V6", description: "Spectrum ring frame" },
];

const coachConnectionBadgeMockups = [
  {
    id: "sideline-link",
    label: "Coach Link",
    icon: Handshake,
    description: "Clean read, closest to the existing chemistry badge shape.",
  },
  {
    id: "system-fit",
    label: "System Fit",
    icon: ClipboardCheck,
    description: "Strategy-board feel that ties directly to coach identity.",
  },
  {
    id: "team-channel",
    label: "Team Sync",
    icon: Users,
    description: "Most obvious team-connection read at small size.",
  },
  {
    id: "coach-boost",
    label: "Coach Boost",
    icon: ShieldCheck,
    description: "Strongest reward signal, reads like an active buff.",
  },
];

const beforeTheGlorySurfaceClass =
  "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(7,10,20,0.16),rgba(7,10,20,0.68)),url('https://i.pinimg.com/1200x/e7/80/14/e780146fa52525722a79eecdc3fbe39c.jpg')] before:bg-cover before:bg-center";

const isSpecialRarityLabel = (rarity: LabRarity) =>
  rarity === "Galaxy" ||
  rarity === "Pink Smoke" ||
  rarity === "Neon Paint" ||
  rarity === "Black/Gold Marble" ||
  rarity === "Amethyst" ||
  rarity === "Emerald" ||
  rarity === "Ruby" ||
  rarity === "Sapphire";

export const CardLabPage = () => {
  const [activeLine, setActiveLine] = useState<CardLabLine>("main-sandbox");
  const [selected, setSelected] = useState(false);
  const [showRunRoster, setShowRunRoster] = useState(false);
  const [holo, setHolo] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(cardLabFocusPlayers[0].id);
  const [rarity, setRarity] = useState<LabRarity>("S");
  const [badgeType, setBadgeType] = useState<PlayerTypeBadge>("sniper");
  const [badgeCount, setBadgeCount] = useState(4);
  const [cardScalePercent, setCardScalePercent] = useState(100);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeLine]);

  const controlledCard =
    cardLabFocusPlayers.find((playerConfig) => playerConfig.id === selectedPlayerId) ?? cardLabFocusPlayers[0];
  const controlledBadges = useMemo(
    () => getCardLabBadgeDefinitions(badgeType, badgeCount),
    [badgeCount, badgeType],
  );
  const beforeTheGloryCards = useMemo(
    () => beforeTheGlorySections.flatMap((section) => section.cards),
    [],
  );
  const coachCards = useMemo(() => coachCardSections.flatMap((section) => section.cards), []);
  const cardScale = cardScalePercent / 100;
  const linePreviewScale = Math.min(cardScale * 0.5, 0.62);
  const lineCardWidth = Math.round(388 * linePreviewScale);
  const lineCardHeight = Math.round(930 * linePreviewScale);
  const scaledPreviewFrame = showRunRoster
    ? {
        width: `${980 * cardScale}px`,
        height: `${132 * cardScale}px`,
      }
    : {
        width: `${388 * cardScale}px`,
        height: `${930 * cardScale}px`,
      };

  const currentFocusTitle =
    activeLine === "main-sandbox"
      ? controlledCard.label
      : activeLine === "before-the-glory"
        ? "Before the Glory"
        : "Coaches";
  const currentFocusDetail =
    activeLine === "main-sandbox"
      ? `${badgeTypeOptions.find((option) => option.value === badgeType)?.label} | ${badgeCount} badge${
          badgeCount === 1 ? "" : "s"
        } | ${isSpecialRarityLabel(rarity) ? rarity : `${rarity}-Tier`}`
      : activeLine === "before-the-glory"
        ? `${beforeTheGloryCards.length} BTG cards`
        : `${coachCards.length} Rogue coach cards`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_28%),linear-gradient(180deg,#08111f_0%,#0f172a_38%,#020617_100%)] text-white">
      <div className="mx-auto max-w-[1560px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <a
                href="/index.html"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                <ArrowLeft size={14} />
                Back To Game
              </a>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-300/18 bg-sky-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100">
                <Sparkles size={14} />
                Card Lab
              </div>
              <h1 className="mt-4 font-display text-[clamp(2.2rem,4vw,4.5rem)] leading-none text-white">
                Player Card Design Sandbox
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Standalone card iteration view for tuning states, rarity treatment, badge density, and compact readability without entering the gameplay loop.
              </p>
            </div>

            <div className="grid min-w-[280px] gap-3 rounded-[28px] border border-white/10 bg-black/20 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Current Focus</div>
                <div className="mt-2 text-lg font-semibold text-white">{currentFocusTitle}</div>
                <div className="mt-1 text-sm text-slate-300">{currentFocusDetail}</div>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs text-slate-200">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Selected</div>
                  <div className="mt-1 font-semibold">{selected ? "On" : "Off"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Holo</div>
                  <div className="mt-1 font-semibold">{holo ? "On" : "Off"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Controls</div>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Card State</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected((value) => !value)}
                      className={`${controlButtonClass} ${
                        selected ? "border-sky-300/40 bg-sky-300/16 text-sky-100" : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRunRoster((value) => !value)}
                      className={`${controlButtonClass} ${
                        showRunRoster ? "border-sky-300/40 bg-sky-300/16 text-sky-100" : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      Run Roster
                    </button>
                    <button
                      type="button"
                      onClick={() => setHolo((value) => !value)}
                      className={`${controlButtonClass} ${
                        holo ? "border-sky-300/40 bg-sky-300/16 text-sky-100" : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      Holo
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Card Line</div>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveLine("main-sandbox")}
                      className={`rounded-2xl border px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        activeLine === "main-sandbox"
                          ? "border-white/20 bg-white text-slate-950"
                          : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      Main Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLine("before-the-glory")}
                      className={`rounded-2xl border px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        activeLine === "before-the-glory"
                          ? "border-white/20 bg-white text-slate-950"
                          : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      Before The Glory
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLine("coaches")}
                      className={`rounded-2xl border px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        activeLine === "coaches"
                          ? "border-white/20 bg-white text-slate-950"
                          : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      Coaches
                    </button>
                  </div>
                </div>

                {activeLine === "main-sandbox" ? (
                  <>
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Player</div>
                      <div className="grid grid-cols-1 gap-2">
                        {cardLabFocusPlayers.map((playerOption) => (
                          <button
                            key={playerOption.id}
                            type="button"
                            onClick={() => setSelectedPlayerId(playerOption.id)}
                            className={`rounded-2xl border px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] transition ${
                              selectedPlayerId === playerOption.id
                                ? "border-white/20 bg-white text-slate-950"
                                : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {playerOption.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Rarity</div>
                      <div className="flex flex-wrap gap-2">
                        {rarityOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setRarity(option)}
                            className={`${controlButtonClass} ${
                              rarity === option ? "border-white/20 bg-white text-slate-950" : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {isSpecialRarityLabel(option) ? option : `${option}-Tier`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Badge Type</div>
                      <div className="grid grid-cols-2 gap-2">
                        {badgeTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setBadgeType(option.value)}
                            className={`rounded-2xl border px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                              badgeType === option.value
                                ? "border-sky-300/40 bg-sky-300/14 text-sky-100"
                                : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Badge Count</div>
                        <div className="text-xs text-slate-400">{badgeCount}</div>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={badgeCount}
                        onChange={(event) => setBadgeCount(Number(event.target.value))}
                        className="mt-3 w-full accent-sky-300"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Card Size</div>
                        <div className="text-xs text-slate-400">{cardScalePercent}%</div>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={130}
                        step={1}
                        value={cardScalePercent}
                        onChange={(event) => setCardScalePercent(Number(event.target.value))}
                        className="mt-3 w-full accent-sky-300"
                      />
                      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        <span>Smaller</span>
                        <span>Proportional Scale</span>
                        <span>Larger</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Card Size</div>
                      <div className="text-xs text-slate-400">{cardScalePercent}%</div>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={130}
                      step={1}
                      value={cardScalePercent}
                      onChange={(event) => setCardScalePercent(Number(event.target.value))}
                      className="mt-3 w-full accent-sky-300"
                    />
                    <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      <span>Smaller</span>
                      <span>Proportional Scale</span>
                      <span>Larger</span>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-3 text-xs leading-6 text-slate-300">
                      {activeLine === "before-the-glory" ? (
                        <>
                          Dedicated preview page for the full <span className="font-semibold text-white">Before the Glory</span> line.
                          All cards below use the current live card design so we can approve the whole set before launch.
                        </>
                      ) : (
                        <>
                          Dedicated preview page for all <span className="font-semibold text-white">Rogue coach cards</span>.
                          These use the same list as the opening Rogue coach node so we can tune the full line before launch.
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
              {activeLine === "main-sandbox" ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Interactive Preview</div>
                      <h2 className="mt-2 font-display text-2xl text-white">2K V3 Working Preview</h2>
                    </div>
                    <div className="rounded-full border border-lime-300/18 bg-lime-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-lime-100">
                      Standalone entry
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {showRunRoster
                      ? "This preview is showing the drafted-on-your-run roster row state so we can tune how players read once they move out of the main card view."
                      : "This main preview area is now dedicated to `2K V3` so we can keep iterating without disturbing the preserved `2K V2` snapshot. The older variants are still available below for comparison when you scroll."}
                  </p>
                  <div className="mt-6 flex justify-center overflow-hidden">
                    <div className="relative max-w-full overflow-hidden">
                      <div className="relative" style={scaledPreviewFrame}>
                        <div className="absolute left-1/2 top-0 -translate-x-1/2">
                          <div
                            style={{
                              transform: `scale(${cardScale})`,
                              transformOrigin: "top center",
                            }}
                          >
                            {showRunRoster ? (
                              <CardLabRunRosterCard
                                player={controlledCard.player}
                                rarityOverride={rarity}
                                draftedPlayerIds={controlledCard.draftedPlayerIds}
                                playerTypeBadgesOverride={controlledBadges}
                                playerTypeBadgeCountOverride={badgeCount}
                                holoOverlay={holo}
                                holoVariant="prism"
                              />
                            ) : (
                              <div className="w-[388px]">
                                <CardLabAltPlayerCardV3
                                  player={controlledCard.player}
                                  selected={selected}
                                  rarityOverride={rarity}
                                  draftedPlayerIds={controlledCard.draftedPlayerIds}
                                  playerTypeBadgesOverride={controlledBadges}
                                  playerTypeBadgeCountOverride={badgeCount}
                                  holoOverlay={holo}
                                  holoVariant="prism"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : activeLine === "before-the-glory" ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Card Line Preview</div>
                      <h2 className="mt-2 font-display text-2xl text-white">Before the Glory</h2>
                    </div>
                    <div className="rounded-full border border-lime-300/18 bg-lime-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-lime-100">
                      {beforeTheGloryCards.length} Cards
                    </div>
                  </div>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
                    Early-career versions of stars with lower overalls and sharper archetype spikes, so the line feels interesting and viable instead of just being weaker copies of peak cards.
                  </p>
                  <div className="mt-6 space-y-8">
                    {beforeTheGlorySections.map((section) => (
                      <div key={section.id}>
                        <div className="mb-4">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{section.title}</div>
                          <div className="mt-1 text-sm text-slate-300">{section.description}</div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6">
                          {section.cards.map((card) => (
                            <div
                              key={card.id}
                              className="flex shrink-0 flex-col items-center"
                              style={{ width: `${lineCardWidth}px`, maxWidth: "100%" }}
                            >
                              <div className="mb-3 text-center">
                                <div className="text-sm font-semibold text-white">{card.label}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                  {card.variantLabel} | {card.player.overall} OVR
                                </div>
                              </div>
                              <div
                                className="relative mx-auto overflow-hidden"
                                style={{
                                  width: `${lineCardWidth}px`,
                                  height: `${lineCardHeight}px`,
                                  maxWidth: "100%",
                                }}
                              >
                                <div
                                  className="absolute left-0 top-0"
                                  style={{
                                    transform: `scale(${linePreviewScale})`,
                                    transformOrigin: "top left",
                                  }}
                                >
                                  <div className="w-[388px]">
                                    <DraftPlayerCard
                                      player={card.player}
                                      rarityOverride={card.player.hallOfFameTier}
                                      draftedPlayerIds={card.draftedPlayerIds}
                                      playerTypeBadgesOverride={getCardLabBadgeDefinitions(card.badgeType, card.badgeCount)}
                                      playerTypeBadgeCountOverride={card.badgeCount}
                                      actionLabel="Before The Glory"
                                      surfaceClassNameOverride={beforeTheGlorySurfaceClass}
                                      holoOverlay={holo}
                                      holoVariant="prism"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Card Line Preview</div>
                      <h2 className="mt-2 font-display text-2xl text-white">Coaches</h2>
                    </div>
                    <div className="rounded-full border border-lime-300/18 bg-lime-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-lime-100">
                      {coachCards.length} Cards
                    </div>
                  </div>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
                    {showRunRoster
                      ? "Run-roster coach rows for the persistent coach card that will sit at the top of the Rogue roster during a run."
                      : "The full 30-card coach line based on the exact same coaches used at the opening Rogue coach node, so we can tune the whole set before launch."}
                  </p>
                  <div className="mt-6 space-y-8">
                    {coachCardSections.map((section) => (
                      <div key={section.id}>
                        <div className="mb-4">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{section.title}</div>
                          <div className="mt-1 text-sm text-slate-300">{section.description}</div>
                        </div>
                        <div className={showRunRoster ? "grid gap-4" : "flex flex-wrap justify-center gap-6"}>
                          {section.cards.map((coach) => (
                            <div
                              key={coach.id}
                              className={showRunRoster ? "flex w-full flex-col items-center" : "flex shrink-0 flex-col items-center"}
                              style={showRunRoster ? undefined : { width: `${lineCardWidth}px`, maxWidth: "100%" }}
                            >
                              <div className="mb-3 text-center">
                                <div className="text-sm font-semibold text-white">{coach.label}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                  {coach.teamName} | Coach
                                </div>
                              </div>
                              {showRunRoster ? (
                                <CardLabCoachRunRosterCard coach={coach} holoOverlay={holo} holoVariant="prism" />
                              ) : (
                                <div
                                  className="relative mx-auto overflow-hidden"
                                  style={{
                                    width: `${lineCardWidth}px`,
                                    height: `${lineCardHeight}px`,
                                    maxWidth: "100%",
                                  }}
                                >
                                  <div
                                    className="absolute left-0 top-0"
                                    style={{
                                      transform: `scale(${linePreviewScale})`,
                                      transformOrigin: "top left",
                                    }}
                                  >
                                    <CardLabCoachCard coach={coach} rarity="Galaxy" holoOverlay={holo} holoVariant="prism" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          {activeLine === "main-sandbox" ? (
            <section className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Comparison Shelf</div>
                  <h2 className="mt-2 font-display text-2xl text-white">Other Variants</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Scroll down here when you want to compare `2K V2` against the original card or the preserved `2K V1` snapshot.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-6 justify-items-center xl:grid-cols-2 2xl:grid-cols-3">
                <div className="w-full">
                  <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Current Variant</div>
                  <div className="mx-auto w-full max-w-[380px]">
                    <DraftPlayerCard
                      player={controlledCard.player}
                      selected={selected}
                      rarityOverride={rarity}
                      draftedPlayerIds={controlledCard.draftedPlayerIds}
                      playerTypeBadgesOverride={controlledBadges}
                      playerTypeBadgeCountOverride={badgeCount}
                      actionLabel="Card Lab Preview"
                      holoOverlay={holo}
                      holoVariant="prism"
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">2K V1</div>
                  <div className="mx-auto w-full max-w-[380px]">
                    <CardLabAltPlayerCardV1
                      player={controlledCard.player}
                      selected={selected}
                      rarityOverride={rarity}
                      draftedPlayerIds={controlledCard.draftedPlayerIds}
                      playerTypeBadgesOverride={controlledBadges}
                      playerTypeBadgeCountOverride={badgeCount}
                      holoOverlay={holo}
                      holoVariant="prism"
                    />
                  </div>
                </div>

                <div className="w-full">
                  <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">2K V2</div>
                  <div className="mx-auto w-full max-w-[380px]">
                    <CardLabAltPlayerCardV2
                      player={controlledCard.player}
                      selected={selected}
                      rarityOverride={rarity}
                      draftedPlayerIds={controlledCard.draftedPlayerIds}
                      playerTypeBadgesOverride={controlledBadges}
                      playerTypeBadgeCountOverride={badgeCount}
                      holoOverlay={holo}
                      holoVariant="prism"
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeLine === "main-sandbox" && holo ? (
            <section className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Holo Compare</div>
                  <h2 className="mt-2 font-display text-2xl text-white">Holo Variant Comparison</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Compare multiple holo treatments on the same base card so we can decide exactly how much rainbow foil and readability we want.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-6 justify-items-center xl:grid-cols-2 2xl:grid-cols-3">
                {holoVariantCards.map((variant) => (
                  <div key={variant.id} className="w-full">
                    <div className="mb-3 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{variant.label}</div>
                      <div className="mt-1 text-xs text-slate-400">{variant.description}</div>
                    </div>
                    <div className="mx-auto w-full max-w-[380px]">
                      <CardLabAltPlayerCardV3
                        player={controlledCard.player}
                        selected={selected}
                        rarityOverride={rarity}
                        draftedPlayerIds={controlledCard.draftedPlayerIds}
                        playerTypeBadgesOverride={controlledBadges}
                        playerTypeBadgeCountOverride={badgeCount}
                        holoOverlay
                        holoVariant={variant.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeLine === "main-sandbox" ? (
            <section className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Coach Connection</div>
                  <h2 className="mt-2 font-display text-2xl text-white">Coach-link badge mockups</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                    Same-team player and coach states using the same active glow language as chemistry badges.
                  </p>
                </div>
                <div className="rounded-full border border-lime-300/18 bg-lime-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-lime-100">
                  Active = same team
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {coachConnectionBadgeMockups.map((mockup) => {
                  const Icon = mockup.icon;

                  return (
                    <div
                      key={mockup.id}
                      className="rounded-[24px] border border-white/10 bg-white/6 p-4 shadow-[0_14px_32px_rgba(0,0,0,0.2)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{mockup.label}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-400">{mockup.description}</div>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-lime-300/70 bg-lime-300/18 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]">
                          <Icon size={18} strokeWidth={2.2} />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className="inline-flex h-8 items-center gap-1.5 rounded-full border border-lime-300/70 bg-lime-300/18 px-2.5 text-[11px] text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]">
                          <Icon size={15} strokeWidth={2.2} />
                          <span className="font-semibold uppercase tracking-[0.16em]">{mockup.label}</span>
                        </div>
                        <div className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/12 bg-black/30 px-2.5 text-[11px] text-slate-500">
                          <Icon size={15} strokeWidth={2.2} />
                          <span className="font-semibold uppercase tracking-[0.16em]">{mockup.label}</span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold text-white">{controlledCard.player.name}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                              Player card tray preview
                            </div>
                          </div>
                          <div className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-lime-300/70 bg-lime-300/18 px-2.5 text-[10px] text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]">
                            <Icon size={13} strokeWidth={2.2} />
                            <span className="font-semibold uppercase tracking-[0.14em]">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {activeLine === "main-sandbox" ? (
            <section className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Gallery</div>
                  <h2 className="mt-2 font-display text-2xl text-white">Six mock player cards</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Mixed archetypes, rarity levels, and states for broad visual comparison at a glance.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {cardLabMockCards.map((card) => (
                  <div key={card.id} className={card.compact ? "mx-auto w-[290px]" : ""}>
                    <DraftPlayerCard
                      player={card.player}
                      selected={card.selected}
                      upgraded={card.upgraded}
                      compact={card.compact}
                      rarityOverride={card.rarity}
                      playerTypeBadgesOverride={getCardLabBadgeDefinitions(card.badgeType, card.badgeCount)}
                      playerTypeBadgeCountOverride={card.badgeCount}
                      draftedPlayerIds={card.draftedPlayerIds}
                      actionLabel="Mock Preview"
                      holoOverlay={holo}
                      holoVariant="prism"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeLine === "main-sandbox" ? (
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Compact Check</div>
                <h2 className="mt-2 font-display text-2xl text-white">Small-size readability preview</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Long names and crowded position labels stay visible here so we can quickly test edge cases.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {cardLabCompactPreviewPlayers.map((player, index) => (
                    <div key={player.id} className="mx-auto w-[272px]">
                      <DraftPlayerCard
                        player={player}
                        compact
                        rarityOverride={rarityOptions[index]}
                        playerTypeBadgesOverride={getCardLabBadgeDefinitions(badgeTypeOptions[index].value, Math.min(3, index + 1))}
                        playerTypeBadgeCountOverride={Math.min(3, index + 1)}
                        actionLabel="Compact Preview"
                        holoOverlay={holo}
                        holoVariant="prism"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-black/18 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
                <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Badge Preview</div>
                <h2 className="mt-2 font-display text-2xl text-white">Type badge set showcase</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Every primary badge treatment is visible in one place for fast comparison.
                </p>
                <div className="mt-5 space-y-3">
                  {badgeTypeOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-white/6 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">{option.label}</div>
                        <div className="mt-1 text-xs text-slate-400">Primary badge focus</div>
                      </div>
                      <div className="rounded-full border border-lime-300/18 bg-lime-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-lime-100">
                        <span className="inline-flex items-center gap-1.5">
                          <Check size={12} />
                          Ready
                        </span>
                      </div>
                      <div className="w-[220px]">
                        <DraftPlayerCard
                          player={controlledCard.player}
                          compact
                          rarityOverride="A"
                          playerTypeBadgesOverride={getCardLabBadgeDefinitions(option.value, 1)}
                          playerTypeBadgeCountOverride={1}
                          actionLabel={option.label}
                          holoOverlay={holo}
                          holoVariant="prism"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
};
