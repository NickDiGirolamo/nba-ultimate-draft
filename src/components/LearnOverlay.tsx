import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Crown,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Users,
  X,
  Zap,
  Link2,
  LayoutPanelTop,
} from "lucide-react";

const quickStartSteps = [
  {
    title: "Start with the challenge goal",
    description:
      "If the run is focused on offense, defense, passing, or another category, let that break ties between similar players from the very first pick.",
    icon: Target,
    tone: "text-amber-100 bg-amber-300/12 border-amber-200/15",
  },
  {
    title: "Watch Chemistry every pick",
    description:
      "Chemistry now covers both badge synergies and whether your roster makes sense positionally, so it is one of the fastest ways to feel a pick's real impact.",
    icon: Link2,
    tone: "text-lime-100 bg-lime-300/12 border-lime-200/15",
  },
  {
    title: "Use the reorder screen seriously",
    description:
      "Starter slots matter more than bench slots. A team can look strong on paper and still lose value if the roles are arranged poorly.",
    icon: LayoutPanelTop,
    tone: "text-sky-100 bg-sky-300/12 border-sky-200/15",
  },
];

const categoryCards = [
  {
    label: "Overall",
    icon: Crown,
    tone: "text-amber-100 bg-amber-300/12 border-amber-200/15",
    description:
      "Your total roster power score. This is the broadest measure of how strong the team is across the full sim.",
  },
  {
    label: "Offense",
    icon: Zap,
    tone: "text-rose-100 bg-rose-300/12 border-rose-200/15",
    description:
      "Scoring pressure, star shot creation, and your ability to generate points over a full season and playoff run.",
  },
  {
    label: "Defense",
    icon: ShieldCheck,
    tone: "text-sky-100 bg-sky-300/12 border-sky-200/15",
    description:
      "Stops, rim protection, wing resistance, and how hard your team is to score on in high-leverage games.",
  },
  {
    label: "Passing",
    icon: Users,
    tone: "text-cyan-100 bg-cyan-300/12 border-cyan-200/15",
    description:
      "Ball movement, initiation, and how well your roster creates clean looks for teammates.",
  },
  {
    label: "Shooting",
    icon: Target,
    tone: "text-fuchsia-100 bg-fuchsia-300/12 border-fuchsia-200/15",
    description:
      "Spacing gravity and perimeter shotmaking. Great shooting opens the floor for stars and role players alike.",
  },
  {
    label: "Rebounding",
    icon: Sparkles,
    tone: "text-emerald-100 bg-emerald-300/12 border-emerald-200/15",
    description:
      "Control of the glass on both ends. Rebounding helps you end possessions and create extra ones.",
  },
  {
    label: "Chemistry",
    icon: Swords,
    tone: "text-lime-100 bg-lime-300/12 border-lime-200/15",
    description:
      "Your roster's on-court coherence. Chemistry now combines badge synergies with lineup structure, so it rises when players connect naturally and are slotted into sensible roles and positions.",
  },
];

const badgeCards = [
  {
    label: "Dynamic Duo",
    description:
      "A two-player synergy link. Draft both players and you unlock a stronger shared boost than either player gets alone.",
  },
  {
    label: "Big 3",
    description:
      "A three-player chemistry set. The full trio has to be drafted together before the bonus completes.",
  },
  {
    label: "Rivals",
    description:
      "High-friction player history. Rivals can change the way a roster feels and add interesting tension to lineup building.",
  },
  {
    label: "Role Player",
    description:
      "A supporting piece tied to a specific centerpiece star. These help complete identity builds and make certain stars feel more intentional to draft around.",
  },
  {
    label: "Centerpiece",
    description:
      "A star who gets stronger when the right supporting role players are already on your roster. If this badge glows, drafting that star would cash in on work you've already done.",
  },
];

const gameplayNotes = [
  "You draft 10 players total. Each pick is permanent unless a Prestige reward gives you a special bonus pick later.",
  "Your lineup order matters. Starters carry more sim weight than bench roles, so the reorder screen is important.",
  "Challenges are now the main source of Prestige XP. Clearing new routes is the fastest way to level up.",
  "Category-focus challenges grade you on one target metric, but balanced rosters still matter because weak spots can drag the team down elsewhere.",
];

interface LearnOverlayProps {
  onClose: () => void;
}

export const LearnOverlay = ({ onClose }: LearnOverlayProps) => {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] bg-slate-950/72 backdrop-blur-md"
      onMouseDown={onClose}
    >
      <div className="mx-auto flex h-screen max-w-[1280px] items-start justify-center overflow-y-auto px-4 py-8 md:px-6">
        <div
          className="glass-panel my-auto w-full rounded-[34px] border border-white/12 bg-slate-950/95 p-6 shadow-card lg:p-8"
          onMouseDown={(event) => event.stopPropagation()}
        >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-sky-200/80">
              <BookOpen size={14} />
              Learn The Game
            </div>
            <h2 className="mt-3 font-display text-4xl text-white">How the draft works</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              This page explains what the main team metrics mean, how chemistry badges work, and what the game wants
              you to optimize while drafting and simming.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-panel rounded-[28px] p-5 shadow-card">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Quick Start</div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {quickStartSteps.map((item) => (
                <div key={item.title} className={`rounded-[22px] border p-4 ${item.tone}`}>
                  <div className="flex items-center gap-2">
                    <item.icon size={16} />
                    <div className="font-semibold text-white">{item.title}</div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-200">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-xs uppercase tracking-[0.22em] text-slate-400">Core Categories</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {categoryCards.map((item) => (
                <div key={item.label} className={`rounded-[22px] border p-4 ${item.tone}`}>
                  <div className="flex items-center gap-2">
                    <item.icon size={16} />
                    <div className="font-semibold text-white">{item.label}</div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-200">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-[28px] p-5 shadow-card">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Chemistry Badges</div>
              <div className="mt-5 space-y-3">
                {badgeCards.map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">{item.label}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[28px] p-5 shadow-card">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Quick Notes</div>
              <div className="mt-5 space-y-3">
                {gameplayNotes.map((note) => (
                  <div key={note} className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                    {note}
                  </div>
                ))}
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
