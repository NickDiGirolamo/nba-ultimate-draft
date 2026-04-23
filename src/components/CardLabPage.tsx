import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { CardLabAltPlayerCardV1 } from "./CardLabAltPlayerCardV1";
import { CardLabAltPlayerCardV2 } from "./CardLabAltPlayerCardV2";
import { CardLabAltPlayerCardV3 } from "./CardLabAltPlayerCard";
import { CardLabRunRosterCard } from "./CardLabRunRosterCard";
import { DraftPlayerCard } from "./DraftPlayerCard";
import {
  cardLabCompactPreviewPlayers,
  cardLabFocusPlayers,
  cardLabMockCards,
  getCardLabBadgeDefinitions,
} from "../lib/cardLab";
import { LegacyPlayerTier, PlayerTier } from "../types";
import { PlayerTypeBadge } from "../lib/playerTypeBadges";

type LabRarity = PlayerTier | LegacyPlayerTier | "Pink Smoke" | "Neon Paint" | "Black/Gold Marble";

const rarityOptions: LabRarity[] = ["S", "A", "B", "C", "D", "Galaxy", "Pink Smoke", "Neon Paint", "Black/Gold Marble", "Amethyst", "Emerald", "Ruby", "Sapphire"];
const badgeTypeOptions: Array<{ value: PlayerTypeBadge; label: string }> = [
  { value: "sniper", label: "Sniper" },
  { value: "board-man", label: "Board Man" },
  { value: "playmaker", label: "Play Maker" },
  { value: "lockdown", label: "Lockdown" },
  { value: "slasher", label: "Slasher" },
];

const controlButtonClass =
  "rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition";

export const CardLabPage = () => {
  const [selected, setSelected] = useState(false);
  const [showRunRoster, setShowRunRoster] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(cardLabFocusPlayers[0].id);
  const [rarity, setRarity] = useState<LabRarity>("S");
  const [badgeType, setBadgeType] = useState<PlayerTypeBadge>("sniper");
  const [badgeCount, setBadgeCount] = useState(4);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const controlledCard =
    cardLabFocusPlayers.find((playerConfig) => playerConfig.id === selectedPlayerId) ?? cardLabFocusPlayers[0];
  const controlledBadges = useMemo(
    () => getCardLabBadgeDefinitions(badgeType, badgeCount),
    [badgeCount, badgeType],
  );

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
                <div className="mt-2 text-lg font-semibold text-white">{controlledCard.label}</div>
                <div className="mt-1 text-sm text-slate-300">
                  {badgeTypeOptions.find((option) => option.value === badgeType)?.label} | {badgeCount} badge{badgeCount === 1 ? "" : "s"} | {rarity === "Galaxy" || rarity === "Pink Smoke" || rarity === "Neon Paint" || rarity === "Black/Gold Marble" || rarity === "Amethyst" || rarity === "Emerald" || rarity === "Ruby" || rarity === "Sapphire" ? rarity : `${rarity}-Tier`}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs text-slate-200">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Selected</div>
                  <div className="mt-1 font-semibold">{selected ? "On" : "Off"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Controls</div>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Card State</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected((value) => !value)}
                      className={`${controlButtonClass} ${selected ? "border-sky-300/40 bg-sky-300/16 text-sky-100" : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"}`}
                    >
                      Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRunRoster((value) => !value)}
                      className={`${controlButtonClass} ${showRunRoster ? "border-sky-300/40 bg-sky-300/16 text-sky-100" : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"}`}
                    >
                      Run Roster
                    </button>
                  </div>
                </div>

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
                      className={`${controlButtonClass} ${rarity === option ? "border-white/20 bg-white text-slate-950" : "border-white/12 bg-white/6 text-slate-300 hover:bg-white/10"}`}
                    >
                        {option === "Galaxy" || option === "Pink Smoke" || option === "Neon Paint" || option === "Black/Gold Marble" || option === "Amethyst" || option === "Emerald" || option === "Ruby" || option === "Sapphire" ? option : `${option}-Tier`}
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
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
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
              <div className="mt-6 flex justify-center">
                <div className={showRunRoster ? "w-auto max-w-full" : "w-full max-w-[380px]"}>
                  {showRunRoster ? (
                    <CardLabRunRosterCard
                      player={controlledCard.player}
                      rarityOverride={rarity}
                      draftedPlayerIds={controlledCard.draftedPlayerIds}
                      playerTypeBadgesOverride={controlledBadges}
                      playerTypeBadgeCountOverride={badgeCount}
                    />
                  ) : (
                    <CardLabAltPlayerCardV3
                      player={controlledCard.player}
                      selected={selected}
                      rarityOverride={rarity}
                      draftedPlayerIds={controlledCard.draftedPlayerIds}
                      playerTypeBadgesOverride={controlledBadges}
                      playerTypeBadgeCountOverride={badgeCount}
                    />
                  )}
                </div>
              </div>
            </section>
          </div>

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
                  />
                </div>
              </div>
            </div>
          </section>

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
                  />
                </div>
              ))}
            </div>
          </section>

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
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
