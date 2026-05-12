import { Sparkles } from "lucide-react";

interface LabPackPreview {
  id: string;
  name: string;
  tier: string;
  playerName: string;
  playerTeam: string;
  playerImage: string;
  wrapperImage: string;
  cardCount: string;
  description: string;
  tintClass: string;
  playerClass: string;
  shadowClass: string;
}

const labPacks: LabPackPreview[] = [
  {
    id: "emerald-pack",
    name: "Emerald Pack",
    tier: "Emerald",
    playerName: "Al Horford",
    playerTeam: "Warriors",
    playerImage: "/ai-card-art/players/al-horford-cutout.png",
    wrapperImage: "/pack-art/emerald-pack-vivid-v1.png",
    cardCount: "5",
    description: "Emerald-tier preview anchored by Al Horford with green mineral foil.",
    tintClass: "from-emerald-300/26 via-transparent to-emerald-950/42",
    playerClass: "left-1/2 top-[92px] h-[490px] -translate-x-1/2",
    shadowClass: "shadow-[0_28px_80px_rgba(16,185,129,0.32)]",
  },
  {
    id: "sapphire-pack",
    name: "Sapphire Pack",
    tier: "Sapphire",
    playerName: "Josh Hart",
    playerTeam: "Knicks",
    playerImage: "/pack-art/players/josh-hart-cutout.png",
    wrapperImage: "/pack-art/sapphire-pack-vivid-v1.png",
    cardCount: "8",
    description: "Sapphire-tier preview with Josh Hart and deep blue crystal foil.",
    tintClass: "from-sky-300/28 via-transparent to-blue-950/44",
    playerClass: "left-1/2 top-[88px] h-[482px] -translate-x-1/2",
    shadowClass: "shadow-[0_28px_80px_rgba(37,99,235,0.34)]",
  },
  {
    id: "ruby-pack",
    name: "Ruby Pack",
    tier: "Ruby",
    playerName: "Stephon Castle",
    playerTeam: "Spurs",
    playerImage: "/pack-art/players/stephon-castle-cutout.png",
    wrapperImage: "/pack-art/ruby-pack-vivid-v1.png",
    cardCount: "10",
    description: "Ruby-tier preview with Stephon Castle and faceted red gemstone foil.",
    tintClass: "from-rose-300/28 via-transparent to-red-950/46",
    playerClass: "left-1/2 top-[94px] h-[482px] -translate-x-1/2",
    shadowClass: "shadow-[0_28px_80px_rgba(185,28,28,0.34)]",
  },
  {
    id: "amethyst-pack",
    name: "Amethyst Pack",
    tier: "Amethyst",
    playerName: "Victor Wembanyama",
    playerTeam: "Spurs",
    playerImage: "/pack-art/players/victor-wembanyama-cutout.png",
    wrapperImage: "/pack-art/amethyst-pack-vivid-v1.png",
    cardCount: "12",
    description: "Amethyst-tier preview with Victor Wembanyama and violet mineral refraction.",
    tintClass: "from-violet-300/30 via-transparent to-purple-950/48",
    playerClass: "left-1/2 top-[36px] h-[552px] -translate-x-1/2",
    shadowClass: "shadow-[0_30px_88px_rgba(126,34,206,0.34)]",
  },
  {
    id: "galaxy-pack",
    name: "Galaxy Pack",
    tier: "Galaxy",
    playerName: "Kobe Bryant",
    playerTeam: "Lakers",
    playerImage: "/pack-art/players/kobe-bryant-cutout.png",
    wrapperImage: "/pack-art/galaxy-pack-vivid-v1.png",
    cardCount: "15",
    description: "Galaxy-tier preview with Kobe Bryant and cosmic black-gold holo foil.",
    tintClass: "from-yellow-200/18 via-indigo-400/16 to-slate-950/54",
    playerClass: "left-1/2 top-[82px] h-[490px] -translate-x-1/2",
    shadowClass: "shadow-[0_30px_90px_rgba(148,163,184,0.34)]",
  },
];

const packWidth = 318;
const packHeight = 636;

const PackWrapperPreview = ({ pack, scale }: { pack: LabPackPreview; scale: number }) => (
  <div
    className="relative"
    style={{
      width: `${packWidth * scale}px`,
      height: `${packHeight * scale}px`,
    }}
  >
    <div
      className="absolute left-0 top-0"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div className={`relative h-[636px] w-[318px] overflow-hidden rounded-[8px] ${pack.shadowClass}`}>
        <img
          src={pack.wrapperImage}
          alt={`${pack.name} foil wrapper base`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${pack.tintClass} mix-blend-color`} />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,transparent_0%,rgba(255,255,255,0.12)_18%,transparent_34%,rgba(255,255,255,0.18)_52%,transparent_68%,rgba(255,255,255,0.1)_84%,transparent_100%)] opacity-75" />

        <img
          src={pack.playerImage}
          alt={`${pack.playerName} preview art`}
          className={`absolute z-10 w-auto object-contain drop-shadow-[0_20px_24px_rgba(0,0,0,0.62)] ${pack.playerClass}`}
          draggable={false}
        />

        <div className="absolute right-5 top-[86px] z-20 min-w-[74px] rounded-[6px] border border-white/24 bg-black/62 px-3 py-2 text-center shadow-[0_12px_28px_rgba(0,0,0,0.36)] backdrop-blur-sm">
          <div className="font-display text-[34px] font-extrabold leading-none text-white">{pack.cardCount}</div>
          <div className="mt-1 text-[11px] font-black uppercase leading-none tracking-[0.08em]">Cards</div>
        </div>

        <div className="absolute inset-x-5 bottom-[82px] z-20 rounded-[6px] border border-white/20 bg-black/74 px-4 py-3 shadow-[0_16px_30px_rgba(0,0,0,0.42)] backdrop-blur-sm">
          <div className="text-center font-display text-[30px] font-extrabold uppercase leading-none tracking-[0.02em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {pack.name}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const CardLabPacks = ({ scale }: { scale: number }) => (
  <div>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Pack Visual Preview</div>
        <h2 className="mt-2 font-display text-2xl text-white">Tier Pack Concepts</h2>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/18 bg-amber-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100">
        <Sparkles size={13} />
        Lab Only
      </div>
    </div>
    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
      Glossy sealed-wrapper pack concepts using the original foil visuals, updated with tier theming and the newest player cutouts. These stay isolated in Card Lab until you approve a direction for the real Token Store.
    </p>

    <div className="mt-6 grid gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {labPacks.map((pack) => (
        <div key={pack.id} className="flex min-w-0 flex-col items-center">
          <PackWrapperPreview pack={pack} scale={scale} />
          <div className="mt-4 w-full max-w-[318px] rounded-[20px] border border-white/10 bg-white/6 p-3">
            <div className="text-sm font-semibold text-white">{pack.name}</div>
            <div className="mt-1 text-xs leading-5 text-slate-400">{pack.description}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
