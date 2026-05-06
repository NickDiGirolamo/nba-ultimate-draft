import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("public/ai-card-art/backgrounds");
fs.mkdirSync(outDir, { recursive: true });

const tiers = {
  emerald: ["#34d399", "#d1fae5", "#04140f", "#064e3b"],
  sapphire: ["#38bdf8", "#dbeafe", "#020817", "#1d4ed8"],
  ruby: ["#fb7185", "#fee2e2", "#180307", "#991b1b"],
  amethyst: ["#a855f7", "#f3e8ff", "#07010d", "#581c87"],
  galaxy: ["#7dd3fc", "#e879f9", "#020617", "#312e81"],
};

const shard = (points, fill, opacity = 1, stroke = "rgba(255,255,255,.25)") => `
  <polygon points="${points}" fill="${fill}" opacity="${opacity}" stroke="${stroke}" stroke-width="2"/>
`;

const strokes = (primary, secondary) => `
  <g opacity=".78" style="mix-blend-mode:screen">
    <polygon points="-120,310 470,95 910,190 240,405" fill="url(#strokeA)"/>
    <polygon points="-95,610 540,375 870,455 145,735" fill="url(#strokeB)" opacity=".72"/>
    <polygon points="12,760 620,530 825,610 195,865" fill="url(#strokeA)" opacity=".46"/>
  </g>
  <g opacity=".56" style="mix-blend-mode:screen">
    <path d="M80 170 L680 20" stroke="${secondary}" stroke-width="7"/>
    <path d="M35 275 L706 92" stroke="${primary}" stroke-width="5"/>
    <path d="M96 812 L722 632" stroke="${primary}" stroke-width="4"/>
    <path d="M210 112 L690 950" stroke="${secondary}" stroke-width="2"/>
  </g>
`;

const crystalGroups = (primary, secondary) => `
  <g style="mix-blend-mode:screen">
    ${shard("8,290 118,100 265,162 210,775 42,700", "url(#crystalMain)", 0.95)}
    ${shard("88,462 202,305 285,405 170,848 58,725", "url(#crystalHot)", 0.74)}
    ${shard("202,330 302,180 386,242 315,700 220,655", "url(#crystalMain)", 0.45)}
    ${shard("590,135 742,215 760,690 608,842 506,420", "url(#crystalMain)", 0.98)}
    ${shard("520,390 665,285 734,465 624,892 502,710", "url(#crystalHot)", 0.78)}
    ${shard("432,610 564,530 650,680 500,1030 385,880", "url(#crystalMain)", 0.52)}
    <g opacity=".48">
      ${Array.from({ length: 30 }, (_, index) => {
        const x = 42 + ((index * 113) % 680);
        const y = 120 + ((index * 167) % 650);
        const w = 18 + ((index * 19) % 42);
        const h = 52 + ((index * 29) % 86);
        return shard(`${x},${y + h * 0.2} ${x + w * 0.48},${y} ${x + w},${y + h * 0.36} ${x + w * 0.62},${y + h} ${x + w * 0.1},${y + h * 0.78}`, index % 2 ? primary : secondary, 0.3);
      }).join("")}
    </g>
  </g>
`;

const stars = (primary, secondary, galaxy) => `
  <g style="mix-blend-mode:screen">
    ${Array.from({ length: galaxy ? 95 : 45 }, (_, index) => {
      const x = 20 + ((index * 89) % 720);
      const y = 26 + ((index * 149) % 910);
      const r = galaxy ? 1 + (index % 4) * 0.42 : 0.75 + (index % 3) * 0.26;
      const color = index % 5 === 0 ? primary : index % 7 === 0 ? secondary : "white";
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${galaxy ? 0.78 : 0.48}"/>`;
    }).join("")}
  </g>
`;

const svgForTier = (slug, [primary, secondary, deep, mid]) => {
  const galaxy = slug === "galaxy";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1190" viewBox="0 0 768 1190">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${deep}"/>
      <stop offset=".34" stop-color="#050611"/>
      <stop offset=".64" stop-color="${mid}"/>
      <stop offset="1" stop-color="#000"/>
    </linearGradient>
    <radialGradient id="glow" cx=".56" cy=".35" r=".62">
      <stop offset="0" stop-color="${primary}" stop-opacity="${galaxy ? ".34" : ".46"}"/>
      <stop offset=".42" stop-color="${mid}" stop-opacity=".18"/>
      <stop offset="1" stop-color="#000" stop-opacity=".86"/>
    </radialGradient>
    <linearGradient id="strokeA" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${primary}" stop-opacity="0"/>
      <stop offset=".28" stop-color="${primary}" stop-opacity=".9"/>
      <stop offset=".52" stop-color="${secondary}" stop-opacity=".5"/>
      <stop offset="1" stop-color="${primary}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="strokeB" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${secondary}" stop-opacity="0"/>
      <stop offset=".32" stop-color="${secondary}" stop-opacity=".7"/>
      <stop offset=".72" stop-color="${primary}" stop-opacity=".58"/>
      <stop offset="1" stop-color="${primary}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="crystalMain" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${secondary}" stop-opacity=".92"/>
      <stop offset=".34" stop-color="${primary}" stop-opacity=".76"/>
      <stop offset="1" stop-color="${mid}" stop-opacity=".16"/>
    </linearGradient>
    <linearGradient id="crystalHot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
      <stop offset=".38" stop-color="${secondary}" stop-opacity=".56"/>
      <stop offset="1" stop-color="${primary}" stop-opacity=".16"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>
  <rect width="768" height="1190" fill="url(#base)"/>
  <rect width="768" height="1190" fill="url(#glow)"/>
  <ellipse cx="420" cy="355" rx="360" ry="280" fill="${primary}" opacity="${galaxy ? ".16" : ".22"}" filter="url(#softGlow)"/>
  ${strokes(primary, secondary)}
  ${crystalGroups(primary, secondary)}
  ${stars(primary, secondary, galaxy)}
  <path d="M0 0H768V1190H0z" fill="url(#vignette)" opacity="0"/>
  <rect width="768" height="1190" fill="url(#bottomFade)"/>
  <defs>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset=".42" stop-color="#000" stop-opacity="0"/>
      <stop offset=".78" stop-color="#000" stop-opacity=".7"/>
      <stop offset="1" stop-color="#000" stop-opacity=".96"/>
    </linearGradient>
  </defs>
</svg>`;
};

Object.entries(tiers).forEach(([slug, palette]) => {
  const outPath = path.join(outDir, `${slug}-reference-bg.svg`);
  fs.writeFileSync(outPath, svgForTier(slug, palette), "utf8");
  console.log(outPath);
});
