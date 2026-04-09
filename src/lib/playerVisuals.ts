import { Player } from "../types";

const palettes = [
  {
    bg: "from-sky-500/35 via-cyan-400/10 to-slate-950",
    orb: "bg-sky-300/35",
    accent: "from-sky-300 to-cyan-200",
    line: "border-sky-200/30",
  },
  {
    bg: "from-amber-400/30 via-orange-300/10 to-slate-950",
    orb: "bg-amber-300/35",
    accent: "from-amber-200 to-orange-200",
    line: "border-amber-200/30",
  },
  {
    bg: "from-rose-500/30 via-fuchsia-400/10 to-slate-950",
    orb: "bg-rose-300/30",
    accent: "from-rose-200 to-fuchsia-200",
    line: "border-rose-200/30",
  },
  {
    bg: "from-emerald-500/28 via-teal-300/10 to-slate-950",
    orb: "bg-emerald-300/30",
    accent: "from-emerald-200 to-teal-100",
    line: "border-emerald-200/30",
  },
  {
    bg: "from-violet-500/30 via-indigo-300/10 to-slate-950",
    orb: "bg-violet-300/35",
    accent: "from-violet-200 to-indigo-100",
    line: "border-violet-200/30",
  },
];

const motifs = [
  "[clip-path:polygon(0_28%,100%_0,100%_76%,0_100%)]",
  "[clip-path:polygon(12%_0,100%_18%,88%_100%,0_82%)]",
  "[clip-path:polygon(0_12%,100%_0,88%_88%,0_100%)]",
  "[clip-path:polygon(0_0,100%_10%,100%_100%,10%_90%)]",
];

const hashString = (value: string) =>
  value.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);

export const getPlayerVisual = (player: Player) => {
  const hash = hashString(player.id);
  const palette = palettes[hash % palettes.length];
  const motif = motifs[hash % motifs.length];
  const surname = player.name.split(" ").slice(-1)[0] ?? player.name;
  const initials = player.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const tagline =
    player.primaryPosition === "PG"
      ? "Lead Creator"
      : player.primaryPosition === "C"
        ? "Interior Anchor"
        : player.primaryPosition === "PF"
          ? "Frontcourt Force"
          : "Wing Alpha";

  return {
    ...palette,
    motif,
    surname,
    initials,
    tagline,
    jerseyNumber: String(1 + (hash % 98)).padStart(2, "0"),
  };
};
