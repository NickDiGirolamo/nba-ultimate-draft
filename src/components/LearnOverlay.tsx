import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  BookOpen,
  Boxes,
  ClipboardList,
  Crown,
  Dumbbell,
  Gauge,
  HandCoins,
  Landmark,
  Link2,
  LucideIcon,
  PackageOpen,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

type LearnTabId = "basics" | "cards" | "badges" | "bosses" | "locker" | "progression";

interface LearnTab {
  id: LearnTabId;
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

interface LearnCard {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}

const learnTabs: LearnTab[] = [
  {
    id: "basics",
    label: "Run Basics",
    icon: ClipboardList,
    title: "How a Rogue run works",
    description:
      "Build a team one decision at a time, survive the ladder, and keep improving until the final boss gates.",
  },
  {
    id: "cards",
    label: "Player Cards",
    icon: PackageOpen,
    title: "How to read player cards",
    description:
      "Every card tells you more than rating. Team, tier, positions, player types, and chemistry clues all matter.",
  },
  {
    id: "badges",
    label: "Badges",
    icon: BadgeCheck,
    title: "Badges and chemistry links",
    description:
      "Rogue rewards smart roster connections. Badges help explain why certain groups of players fit together.",
  },
  {
    id: "bosses",
    label: "Boss Battles",
    icon: Swords,
    title: "Boss battles and game simulation",
    description:
      "Boss games test how well your lineup, player roles, chemistry, and badge mix perform against a high-pressure opponent.",
  },
  {
    id: "locker",
    label: "Locker Room",
    icon: HandCoins,
    title: "Locker room cash and upgrades",
    description:
      "Locker room visits let you buy short-term tools, permanent run boosts, and targeted ways to fix your roster.",
  },
  {
    id: "progression",
    label: "Progression",
    icon: Trophy,
    title: "Rewards, tokens, and long-term progress",
    description:
      "Even a failed run can teach you something and push your account forward through Rogue rewards.",
  },
];

const sectionCards: Record<LearnTabId, LearnCard[]> = {
  basics: [
    {
      title: "Draft around the next problem",
      description:
        "Each floor asks something different from your roster. Early picks build your foundation, while later picks patch gaps before harder bosses.",
      icon: Target,
      tone: "border-amber-200/16 bg-amber-300/10 text-amber-100",
    },
    {
      title: "Your lineup order matters",
      description:
        "Starters carry the most weight. Reordering your lineup can change how strong the same roster feels in challenges and boss games.",
      icon: Users,
      tone: "border-sky-200/16 bg-sky-300/10 text-sky-100",
    },
    {
      title: "Settings shape the run",
      description:
        "Difficulty, coaches, Galaxy cards, training camps, and trades all change the ladder before the run starts.",
      icon: Gauge,
      tone: "border-violet-200/16 bg-violet-300/10 text-violet-100",
    },
    {
      title: "Every run is a roster puzzle",
      description:
        "Raw OVR is powerful, but great Rogue teams usually combine rating, position fit, badge variety, team links, and useful bench depth.",
      icon: Boxes,
      tone: "border-emerald-200/16 bg-emerald-300/10 text-emerald-100",
    },
  ],
  cards: [
    {
      title: "Overall rating",
      description:
        "OVR is the quickest read on card strength. During a run, displayed OVR can include boosts from training, chemistry, coaches, and special effects.",
      icon: Crown,
      tone: "border-amber-200/16 bg-amber-300/10 text-amber-100",
    },
    {
      title: "Positions",
      description:
        "A player can have multiple natural positions. Strong cards can still lose value if they are forced into a bad lineup slot.",
      icon: ClipboardList,
      tone: "border-sky-200/16 bg-sky-300/10 text-sky-100",
    },
    {
      title: "Team logo",
      description:
        "The logo helps you spot same-team chemistry and coach connections. If a pick completes a team link or coach link, the card previews that value.",
      icon: Landmark,
      tone: "border-emerald-200/16 bg-emerald-300/10 text-emerald-100",
    },
    {
      title: "Tier background",
      description:
        "Emerald, Sapphire, Ruby, Amethyst, and Galaxy backgrounds help you quickly understand the card's rarity and expected power band.",
      icon: Sparkles,
      tone: "border-fuchsia-200/16 bg-fuchsia-300/10 text-fuchsia-100",
    },
  ],
  badges: [
    {
      title: "Player type badges",
      description:
        "Sniper, Slasher, Playmaker, Board Man, and Lockdown badges describe what a player adds. Diverse teams tend to perform better than one-note builds.",
      icon: BadgeCheck,
      tone: "border-cyan-200/16 bg-cyan-300/10 text-cyan-100",
    },
    {
      title: "Team Chemistry",
      description:
        "Historical team groups create Team Chem links. Drafting enough connected players can give matching group members a meaningful run boost.",
      icon: Link2,
      tone: "border-lime-200/16 bg-lime-300/10 text-lime-100",
    },
    {
      title: "Dynamic Duos and Big 3s",
      description:
        "Some players have special links with specific teammates. These are easiest to miss if you only draft by OVR, so watch badge icons while choosing.",
      icon: Users,
      tone: "border-violet-200/16 bg-violet-300/10 text-violet-100",
    },
    {
      title: "Coach links",
      description:
        "If coaches are enabled, players from the coach's NBA team can receive a coach boost. The run roster and draft cards show those connections.",
      icon: Shield,
      tone: "border-emerald-200/16 bg-emerald-300/10 text-emerald-100",
    },
  ],
  bosses: [
    {
      title: "Set your best lineup before tipoff",
      description:
        "Your starters, slot choices, bench order, and active boosts all matter. A cleaner lineup gives your players a better chance to play to their strengths.",
      icon: Users,
      tone: "border-amber-200/16 bg-amber-300/10 text-amber-100",
    },
    {
      title: "Lineups are compared by slot",
      description:
        "Point guards are judged against point guards, centers against centers, and so on. A strong player in the wrong role can still create problems.",
      icon: Target,
      tone: "border-sky-200/16 bg-sky-300/10 text-sky-100",
    },
    {
      title: "Badge diversity matters",
      description:
        "Boss analysis values a balanced mix of useful player types. More helpful badges should help the roster profile, not punish it.",
      icon: BadgeCheck,
      tone: "border-fuchsia-200/16 bg-fuchsia-300/10 text-fuchsia-100",
    },
    {
      title: "Game flow reflects the matchup",
      description:
        "Strong fits, boosted stars, balanced roles, and favorable matchups tend to show up in the scoreboard and box score, but individual games can still swing.",
      icon: ClipboardList,
      tone: "border-emerald-200/16 bg-emerald-300/10 text-emerald-100",
    },
  ],
  locker: [
    {
      title: "Locker cash is run-only",
      description:
        "Locker room cash is earned inside the run and spent inside that same run. It helps you react to the team you actually drafted.",
      icon: HandCoins,
      tone: "border-amber-200/16 bg-amber-300/10 text-amber-100",
    },
    {
      title: "Training Camp Tickets",
      description:
        "Training boosts one player for the rest of the run. It is one of the cleanest ways to turn a good fit into a real core piece.",
      icon: Dumbbell,
      tone: "border-emerald-200/16 bg-emerald-300/10 text-emerald-100",
    },
    {
      title: "Special Stuff",
      description:
        "Special Stuff can be bought early and saved for any future boss matchup in the run. When used, one player gets a temporary +3 OVR boost for that boss game only.",
      icon: Zap,
      tone: "border-sky-200/16 bg-sky-300/10 text-sky-100",
    },
    {
      title: "Badge and position tools",
      description:
        "Some purchases add player type badges or position flexibility. These are great for fixing roster fit, not just adding raw rating.",
      icon: BadgeCheck,
      tone: "border-violet-200/16 bg-violet-300/10 text-violet-100",
    },
  ],
  progression: [
    {
      title: "Rogue is the main mode",
      description:
        "Prestige and long-term progress are built around Rogue Mode. The run ladder is the game's main climb.",
      icon: Trophy,
      tone: "border-amber-200/16 bg-amber-300/10 text-amber-100",
    },
    {
      title: "Tokens buy permanent upgrades",
      description:
        "Token Store purchases can unlock better starter packs, Rogue stars, and other long-term tools that shape future runs.",
      icon: HandCoins,
      tone: "border-emerald-200/16 bg-emerald-300/10 text-emerald-100",
    },
    {
      title: "Collections reward discovery",
      description:
        "Completing Rogue collections, such as linked player groups, can pay token bonuses and gives you a reason to chase different builds.",
      icon: Boxes,
      tone: "border-fuchsia-200/16 bg-fuchsia-300/10 text-fuchsia-100",
    },
    {
      title: "Autopsy helps the next run",
      description:
        "When a run ends, the recap points at the roster profile and weak spots. Use that to make sharper decisions next time.",
      icon: Target,
      tone: "border-sky-200/16 bg-sky-300/10 text-sky-100",
    },
  ],
};

const tabNotes: Record<LearnTabId, string[]> = {
  basics: [
    "Starter reveal gives your first foundation pieces.",
    "Coach selection can define which team links matter most.",
    "Draft, training, trade, all-star, locker room, and boss floors each solve different problems.",
  ],
  cards: [
    "Draft card OVR previews active boosts where possible.",
    "Run roster cards show the boosted/display OVR after upgrades are applied.",
    "A lower base card can become more valuable if it completes important links.",
  ],
  badges: [
    "All player type badges on a player are valued as real parts of that player's identity.",
    "Team Chem groups are historical roster groups, not just modern NBA teams.",
    "Badges are visual strategy cues: use them to understand what your roster is missing.",
  ],
  bosses: [
    "Your best control happens before tipoff: lineup order, active boosts, player types, and chemistry links.",
    "Well-built teams usually create cleaner scoring runs, stronger defensive stretches, and more believable star performances.",
    "The Head to Head panel helps explain where your lineup gained or lost leverage.",
  ],
  locker: [
    "You do not need to spend cash immediately just because you enter the locker room.",
    "Temporary boosts should be timed around difficult boss floors.",
    "Permanent boosts are strongest when applied to players who already fit the roster.",
  ],
  progression: [
    "A run can still be valuable even if it ends early.",
    "Permanent account upgrades should make future starts feel more exciting.",
    "Collections encourage trying more than one roster-building path.",
  ],
};

interface LearnOverlayProps {
  onClose: () => void;
}

export const LearnOverlay = ({ onClose }: LearnOverlayProps) => {
  const [activeTabId, setActiveTabId] = useState<LearnTabId>("basics");

  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const activeTab = useMemo(
    () => learnTabs.find((tab) => tab.id === activeTabId) ?? learnTabs[0],
    [activeTabId],
  );
  const ActiveIcon = activeTab.icon;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-tutorial-id="learn-overlay"
      className="fixed inset-0 z-[130] overflow-hidden bg-slate-950/74 backdrop-blur-md"
      onMouseDown={onClose}
    >
      <div className="mx-auto flex h-full max-w-[1360px] items-center justify-center overflow-hidden px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        <div
          className="glass-panel max-h-full w-full overflow-hidden rounded-[28px] border border-white/14 bg-[linear-gradient(180deg,rgba(12,18,30,0.98),rgba(5,8,15,0.98))] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.48)] lg:rounded-[34px] lg:p-5"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/16 bg-sky-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-sky-200/86">
                <BookOpen size={14} />
                Learn NBA Rogue Mode
              </div>
              <h2 className="mt-2 font-display text-3xl leading-none text-white sm:text-4xl">
                Rogue run guidebook
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
                Use this as the in-game guide for reading cards, building chemistry, surviving boss battles,
                spending locker room cash, and understanding what each run is asking from your team.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:border-white/20 hover:text-white"
              aria-label="Close Learn overlay"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 grid min-h-0 gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
            <div data-tutorial-id="learn-tabs" className="min-h-0 rounded-[24px] border border-white/10 bg-white/[0.035] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="px-3 pb-1.5 pt-1 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Topics
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                {learnTabs.map((tab) => {
                  const selected = tab.id === activeTabId;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTabId(tab.id)}
                      className={`flex items-center gap-3 rounded-[18px] border px-3 py-2.5 text-left text-sm font-semibold transition ${
                        selected
                          ? "border-sky-200/34 bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(255,255,255,0.07))] text-white shadow-[0_12px_28px_rgba(56,189,248,0.12)]"
                          : "border-white/8 bg-black/12 text-slate-300 hover:border-white/14 hover:bg-white/7 hover:text-white"
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border ${
                        selected
                          ? "border-sky-100/28 bg-sky-300/12 text-sky-100"
                          : "border-white/10 bg-white/6 text-slate-300"
                      }`}>
                        <TabIcon size={16} />
                      </span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0">
              <div data-tutorial-id="learn-content" className="overflow-hidden rounded-[28px] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.16),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.88),rgba(8,13,24,0.96))] p-4 shadow-[0_20px_54px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                      <ActiveIcon size={13} />
                      {activeTab.label}
                    </div>
                    <h3 className="mt-2 font-display text-2xl leading-tight text-white sm:text-3xl">{activeTab.title}</h3>
                    <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-300">
                      {activeTab.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2.5 md:grid-cols-2">
                  {sectionCards[activeTabId].map((card) => {
                    const CardIcon = card.icon;
                    return (
                      <div
                        key={card.title}
                        className={`rounded-[22px] border p-3 shadow-[0_14px_34px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.05)] ${card.tone}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-current/18 bg-black/18">
                            <CardIcon size={17} />
                          </div>
                          <div>
                            <div className="font-semibold text-white">{card.title}</div>
                            <p className="mt-1.5 text-sm leading-5 text-slate-200/88">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div data-tutorial-id="learn-reminders" className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    Practical reminders
                  </div>
                  <div className="mt-2.5 grid gap-2 md:grid-cols-3">
                    {tabNotes[activeTabId].map((note) => (
                      <div
                        key={note}
                        className="rounded-[18px] border border-white/8 bg-white/[0.045] px-3 py-2.5 text-sm leading-5 text-slate-300"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
