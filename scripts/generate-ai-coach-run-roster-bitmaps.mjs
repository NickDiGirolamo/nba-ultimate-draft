import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(root, "public/ai-card-art/coaches/run-roster");
const sourceDir = resolve(root, ".codex-matrix-tmp/coach-run-roster-source");
const tempDir = resolve(root, ".codex-matrix-tmp/coach-run-roster-render");
mkdirSync(outputDir, { recursive: true });
mkdirSync(sourceDir, { recursive: true });
mkdirSync(tempDir, { recursive: true });

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const cardWidth = 1536;
const cardHeight = 192;
const chromeWindowHeight = 288;

const roguelikeSource = readFileSync(resolve(root, "src/lib/roguelike.ts"), "utf8");
const teamsSource = readFileSync(resolve(root, "src/data/nbaTeams.ts"), "utf8");

const coaches = [...roguelikeSource.matchAll(/\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*teamName:\s*"([^"]+)",\s*conference:\s*"(east|west)"\s*\}/g)].map(
  ([, id, name, teamName, conference]) => ({ id, name, teamName, conference }),
);

const teamLogos = Object.fromEntries(
  [...teamsSource.matchAll(/\{\s*name:\s*"([^"]+)",\s*abbreviation:\s*"([^"]+)",\s*logo:\s*("([^"]+)"|null)/g)].map(
    ([, name, abbreviation, , logo]) => [name, { abbreviation, logo: logo ?? null }],
  ),
);

const teamThemes = {
  "Atlanta Hawks": { primary: "#e03a3e", secondary: "#16191b", accent: "#c1d32f", glow: "rgba(224,58,62,.46)", symbol: "ATL" },
  "Boston Celtics": { primary: "#007a33", secondary: "#082416", accent: "#f0c75e", glow: "rgba(34,197,94,.48)", symbol: "BOS" },
  "Brooklyn Nets": { primary: "#f7f7f7", secondary: "#090909", accent: "#d6d6d6", glow: "rgba(255,255,255,.24)", symbol: "BKN" },
  "Charlotte Hornets": { primary: "#1d8cab", secondary: "#20105f", accent: "#c4ced4", glow: "rgba(29,140,171,.48)", symbol: "CHA" },
  "Chicago Bulls": { primary: "#ce1141", secondary: "#090909", accent: "#f7d782", glow: "rgba(206,17,65,.48)", symbol: "CHI" },
  "Cleveland Cavaliers": { primary: "#860038", secondary: "#041e42", accent: "#fdbb30", glow: "rgba(253,187,48,.42)", symbol: "CLE" },
  "Dallas Mavericks": { primary: "#00538c", secondary: "#002b5e", accent: "#b8c4ca", glow: "rgba(0,83,140,.48)", symbol: "DAL" },
  "Denver Nuggets": { primary: "#1d428a", secondary: "#0e2240", accent: "#fec524", glow: "rgba(254,197,36,.4)", symbol: "DEN" },
  "Detroit Pistons": { primary: "#c8102e", secondary: "#1d42ba", accent: "#bec0c2", glow: "rgba(200,16,46,.48)", symbol: "DET" },
  "Golden State Warriors": { primary: "#1d428a", secondary: "#002b5c", accent: "#ffc72c", glow: "rgba(255,199,44,.42)", symbol: "GSW" },
  "Houston Rockets": { primary: "#ce1141", secondary: "#090909", accent: "#c4ced4", glow: "rgba(206,17,65,.48)", symbol: "HOU" },
  "Indiana Pacers": { primary: "#fdbb30", secondary: "#002d62", accent: "#ffffff", glow: "rgba(253,187,48,.42)", symbol: "IND" },
  "Los Angeles Clippers": { primary: "#c8102e", secondary: "#1d428a", accent: "#bec0c2", glow: "rgba(29,66,138,.45)", symbol: "LAC" },
  "Los Angeles Lakers": { primary: "#552583", secondary: "#090909", accent: "#fdb927", glow: "rgba(253,185,39,.42)", symbol: "LAL" },
  "Memphis Grizzlies": { primary: "#5d76a9", secondary: "#12173f", accent: "#f5b112", glow: "rgba(93,118,169,.48)", symbol: "MEM" },
  "Miami Heat": { primary: "#98002e", secondary: "#090909", accent: "#f9a01b", glow: "rgba(249,160,27,.42)", symbol: "MIA" },
  "Milwaukee Bucks": { primary: "#00471b", secondary: "#0b2419", accent: "#eee1c6", glow: "rgba(0,113,51,.48)", symbol: "MIL" },
  "Minnesota Timberwolves": { primary: "#236192", secondary: "#0c2340", accent: "#78be20", glow: "rgba(120,190,32,.4)", symbol: "MIN" },
  "New Orleans Pelicans": { primary: "#85714d", secondary: "#0c2340", accent: "#c8102e", glow: "rgba(200,16,46,.4)", symbol: "NOP" },
  "New York Knicks": { primary: "#f58426", secondary: "#006bb6", accent: "#bec0c2", glow: "rgba(245,132,38,.42)", symbol: "NYK" },
  "Oklahoma City Thunder": { primary: "#007ac1", secondary: "#002d62", accent: "#ef3b24", glow: "rgba(0,122,193,.46)", symbol: "OKC" },
  "Orlando Magic": { primary: "#0077c0", secondary: "#090909", accent: "#c4ced4", glow: "rgba(0,119,192,.48)", symbol: "ORL" },
  "Philadelphia 76ers": { primary: "#006bb6", secondary: "#ed174c", accent: "#ffffff", glow: "rgba(0,107,182,.46)", symbol: "PHI" },
  "Phoenix Suns": { primary: "#e56020", secondary: "#1d1160", accent: "#f9ad1b", glow: "rgba(229,96,32,.45)", symbol: "PHX" },
  "Portland Trail Blazers": { primary: "#e03a3e", secondary: "#090909", accent: "#ffffff", glow: "rgba(224,58,62,.45)", symbol: "POR" },
  "Sacramento Kings": { primary: "#5a2d81", secondary: "#090909", accent: "#c4ced4", glow: "rgba(90,45,129,.48)", symbol: "SAC" },
  "San Antonio Spurs": { primary: "#c4ced4", secondary: "#090909", accent: "#ffffff", glow: "rgba(196,206,212,.3)", symbol: "SAS" },
  "Toronto Raptors": { primary: "#ce1141", secondary: "#090909", accent: "#a1a1a4", glow: "rgba(206,17,65,.48)", symbol: "TOR" },
  "Utah Jazz": { primary: "#fff21f", secondary: "#002b5c", accent: "#00a9e0", glow: "rgba(255,242,31,.34)", symbol: "UTA" },
  "Washington Wizards": { primary: "#e31837", secondary: "#002b5c", accent: "#c4ced4", glow: "rgba(227,24,55,.45)", symbol: "WAS" },
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getNameClass = (name) => {
  if (name.length > 22) return "coachName coachNameLong";
  if (name.length > 17) return "coachName coachNameMedium";
  return "coachName";
};

const psQuote = (value) => `'${String(value).replace(/'/g, "''")}'`;

const cropPng = (sourcePath, outputPath) => {
  const cropScript = [
    "Add-Type -AssemblyName System.Drawing",
    `$sourcePath = ${psQuote(sourcePath)}`,
    `$outputPath = ${psQuote(outputPath)}`,
    "$image = [System.Drawing.Bitmap]::FromFile($sourcePath)",
    `$cropRect = New-Object System.Drawing.Rectangle 0, 0, ${cardWidth}, ${cardHeight}`,
    "$cropped = $image.Clone($cropRect, $image.PixelFormat)",
    "$image.Dispose()",
    "$cropped.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)",
    "$cropped.Dispose()",
  ].join("; ");

  execFileSync("powershell.exe", ["-NoProfile", "-Command", cropScript], { stdio: "pipe" });
};

const cardHtml = (coach) => {
  const sourcePath = resolve(sourceDir, `${coach.id}.png`);
  const sourceUrl = pathToFileURL(sourcePath).href;
  const theme = teamThemes[coach.teamName] ?? {
    primary: "#38bdf8",
    secondary: "#0f172a",
    accent: "#f6d36d",
    glow: "rgba(56,189,248,.42)",
    symbol: "NBA",
  };
  const team = teamLogos[coach.teamName] ?? { abbreviation: theme.symbol, logo: null };

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
*{box-sizing:border-box}html,body{margin:0;width:${cardWidth}px;height:${cardHeight}px;background:#000;overflow:hidden}
body{font-family:Inter,Arial,sans-serif;color:white}
.card{position:relative;width:${cardWidth}px;height:${cardHeight}px;overflow:hidden;border-radius:38px;background:#030606}
.field{position:absolute;inset:17px 19px;border-radius:28px;overflow:hidden;background:
  radial-gradient(circle at 16% 36%,${theme.glow},transparent 21%),
  radial-gradient(circle at 83% 58%,${theme.primary}3b,transparent 23%),
  linear-gradient(96deg,rgba(12,14,10,.96),${theme.secondary}d9 48%,rgba(2,5,8,.98))}
.field:before{content:"";position:absolute;inset:0;background:
  linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px),
  linear-gradient(0deg,rgba(255,255,255,.045) 1px,transparent 1px);
  background-size:92px 92px,92px 92px;opacity:.18}
.field:after{content:"";position:absolute;inset:0;background:
  linear-gradient(105deg,rgba(0,0,0,.58),transparent 22%,rgba(0,0,0,.08) 54%,rgba(0,0,0,.72)),
  linear-gradient(180deg,rgba(255,255,255,.06),transparent 42%,rgba(0,0,0,.26));}
.playbook{position:absolute;inset:16px 370px 15px 370px;opacity:.56}
.playbook svg{width:100%;height:100%}
.chalkText{position:absolute;right:445px;top:12px;font-size:20px;font-weight:1000;letter-spacing:.38em;color:rgba(255,255,255,.095);transform:rotate(-4deg)}
.badgePattern{position:absolute;left:675px;top:-28px;width:300px;height:245px;border:3px solid rgba(246,211,109,.1);border-radius:42px;transform:rotate(8deg);opacity:.75}
.badgePattern:before,.badgePattern:after{content:"";position:absolute;border:2px solid rgba(255,255,255,.08);border-radius:50%}
.badgePattern:before{left:42px;top:38px;width:122px;height:122px}.badgePattern:after{right:32px;bottom:26px;width:82px;height:82px}
.frame{position:absolute;inset:8px;border:5px solid #c79d36;border-radius:35px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),inset 0 0 30px rgba(246,211,109,.13),0 0 0 2px rgba(0,0,0,.84)}
.innerLine{position:absolute;inset:19px;border:1px solid rgba(255,255,255,.14);border-radius:25px}
.portraitCopy{position:absolute;left:32px;top:25px;width:148px;height:148px;overflow:hidden;border-radius:50%;z-index:4}
.portraitCopy img{position:absolute;left:-32px;top:-25px;width:${cardWidth}px;height:${cardHeight}px;max-width:none}
.leftShade{position:absolute;left:182px;top:27px;width:610px;height:132px;border-radius:18px;background:linear-gradient(90deg,rgba(3,6,8,.36),rgba(3,6,8,.12),transparent);z-index:2}
.eyebrow{position:absolute;left:213px;top:47px;z-index:5;color:#e5bd50;font-size:17px;font-weight:1000;letter-spacing:.09em;text-transform:uppercase;text-shadow:0 3px 8px rgba(0,0,0,.82)}
.coachName{position:absolute;left:213px;top:76px;right:705px;z-index:5;font-family:Impact,"Arial Black",Arial,sans-serif;font-size:58px;font-weight:1000;line-height:.92;letter-spacing:1px;text-transform:uppercase;color:#fff;text-shadow:0 5px 0 rgba(0,0,0,.58),0 9px 16px rgba(0,0,0,.9)}
.coachNameMedium{font-size:51px;top:80px}.coachNameLong{font-size:43px;top:84px;letter-spacing:.5px}
.teamName{position:absolute;left:213px;top:141px;z-index:5;color:rgba(255,255,255,.75);font-size:18px;font-weight:900;letter-spacing:.03em;text-transform:uppercase;text-shadow:0 3px 8px rgba(0,0,0,.9)}
.logoRing{position:absolute;right:415px;top:45px;z-index:5;width:125px;height:125px;border:4px solid #c79d36;border-radius:50%;display:grid;place-items:center;padding:20px;background:
  radial-gradient(circle at 50% 34%,rgba(255,255,255,.17),rgba(2,5,9,.84) 64%),
  ${theme.secondary};box-shadow:0 14px 28px rgba(0,0,0,.62),inset 0 0 18px rgba(246,211,109,.08);overflow:hidden}
.logoRing img{display:block;width:100%;height:100%;object-fit:contain}
.logoFallback{font-size:29px;font-weight:1000;color:${theme.accent};letter-spacing:.04em;text-shadow:0 0 14px ${theme.glow}}
.boostWell{position:absolute;right:47px;top:40px;z-index:4;width:324px;height:112px;border-radius:41px;background:
  linear-gradient(180deg,rgba(255,255,255,.23),rgba(255,255,255,0) 34%),
  radial-gradient(circle at 50% -8%,rgba(111,255,141,.44),transparent 52%),
  linear-gradient(180deg,#24a858 0%,#0f6a36 48%,#082719 100%);
  border:3px solid rgba(173,255,198,.64);box-shadow:inset 0 2px 2px rgba(255,255,255,.18),inset 0 -18px 30px rgba(0,0,0,.32),0 15px 27px rgba(0,0,0,.5)}
.boostWell:before{content:"";position:absolute;inset:10px 22px;border-radius:30px;border:1px solid rgba(255,255,255,.13);background:
  repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 2px,transparent 2px 28px),
  linear-gradient(180deg,rgba(255,255,255,.08),transparent);opacity:.58}
.boostWell:after{content:"";position:absolute;left:24px;right:24px;bottom:13px;height:26px;border-radius:50%;background:rgba(1,8,5,.34);filter:blur(3px)}
</style>
</head>
<body>
<div class="card">
  <div class="field"></div>
  <div class="playbook" aria-hidden="true">
    <svg viewBox="0 0 770 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 122 C120 38 194 31 285 78 S461 154 585 68 S714 17 756 44" stroke="rgba(246,211,109,.34)" stroke-width="4" stroke-linecap="round" stroke-dasharray="18 18"/>
      <path d="M66 34 L185 34 M126 34 L126 118 M573 30 C658 28 710 66 722 124" stroke="rgba(255,255,255,.18)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="214" cy="48" r="16" stroke="rgba(255,255,255,.2)" stroke-width="3"/><circle cx="332" cy="110" r="16" stroke="rgba(255,255,255,.18)" stroke-width="3"/>
      <circle cx="514" cy="76" r="16" stroke="rgba(255,255,255,.18)" stroke-width="3"/><circle cx="668" cy="118" r="16" stroke="rgba(255,255,255,.16)" stroke-width="3"/>
      <path d="M426 35 l30 30 M456 35 l-30 30 M84 103 l28 28 M112 103 l-28 28 M604 42 l28 28 M632 42 l-28 28" stroke="${theme.accent}" stroke-opacity=".34" stroke-width="4" stroke-linecap="round"/>
      <path d="M303 76 Q390 10 491 50" stroke="${theme.primary}" stroke-opacity=".36" stroke-width="5" stroke-linecap="round"/>
      <path d="M487 50 l-31 -6 M487 50 l-18 -27" stroke="${theme.primary}" stroke-opacity=".36" stroke-width="5" stroke-linecap="round"/>
    </svg>
  </div>
  <div class="chalkText">${escapeHtml(theme.symbol)} PLAYBOOK</div>
  <div class="badgePattern"></div>
  <div class="leftShade"></div>
  <div class="portraitCopy"><img src="${sourceUrl}" alt="" /></div>
  <div class="eyebrow">Coach</div>
  <div class="${getNameClass(coach.name)}">${escapeHtml(coach.name)}</div>
  <div class="teamName">${escapeHtml(coach.teamName)}</div>
  <div class="logoRing">${team.logo ? `<img src="${team.logo}" alt="" />` : `<div class="logoFallback">${escapeHtml(team.abbreviation)}</div>`}</div>
  <div class="boostWell"></div>
  <div class="frame"></div>
  <div class="innerLine"></div>
</div>
</body>
</html>`;
};

for (const coach of coaches) {
  const originalPath = resolve(outputDir, `${coach.id}.png`);
  const sourcePath = resolve(sourceDir, `${coach.id}.png`);
  if (!existsSync(sourcePath)) {
    copyFileSync(originalPath, sourcePath);
  }

  const htmlPath = resolve(tempDir, `${coach.id}.html`);
  const pngPath = resolve(outputDir, `${coach.id}.png`);
  const rawPngPath = resolve(tempDir, `${coach.id}.raw.png`);
  writeFileSync(htmlPath, cardHtml(coach), "utf8");
  execFileSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--default-background-color=000000",
    "--allow-file-access-from-files",
    "--force-device-scale-factor=1",
    `--window-size=${cardWidth},${chromeWindowHeight}`,
    `--screenshot=${rawPngPath}`,
    pathToFileURL(htmlPath).href,
  ], { stdio: "pipe" });
  cropPng(rawPngPath, pngPath);
  unlinkSync(rawPngPath);
  console.log(`Generated ${pngPath}`);
}
