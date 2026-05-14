import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(root, "public/ai-card-art/coaches/generated");
const tempDir = resolve(root, ".codex-matrix-tmp/ai-coach-card-render");
mkdirSync(outputDir, { recursive: true });
mkdirSync(tempDir, { recursive: true });

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const cardWidth = 1024;
const cardHeight = 1536;
const coachCardBackgroundImageUrl =
  "https://www.shutterstock.com/image-photo/hand-draw-strategy-game-plan-600nw-2711322611.jpg";

const roguelikeSource = readFileSync(resolve(root, "src/lib/roguelike.ts"), "utf8");
const coachImageSource = readFileSync(resolve(root, "src/components/CardLabCoachCard.tsx"), "utf8");
const teamsSource = readFileSync(resolve(root, "src/data/nbaTeams.ts"), "utf8");

const coaches = [...roguelikeSource.matchAll(/\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*teamName:\s*"([^"]+)",\s*conference:\s*"(east|west)"\s*\}/g)].map(
  ([, id, name, teamName, conference]) => ({ id, name, teamName, conference }),
);

const coachImages = Object.fromEntries(
  [...coachImageSource.matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map(([, id, url]) => [id, url]),
);

const teamLogos = Object.fromEntries(
  [...teamsSource.matchAll(/\{\s*name:\s*"([^"]+)",\s*abbreviation:\s*"([^"]+)",\s*logo:\s*("([^"]+)"|null)/g)].map(
    ([, name, abbreviation, , logo]) => [name, { abbreviation, logo: logo ?? null }],
  ),
);

const teamThemes = {
  "Atlanta Hawks": { primary: "#e03a3e", secondary: "#16191b", accent: "#c1d32f", glow: "rgba(224,58,62,.55)", symbol: "ATL" },
  "Boston Celtics": { primary: "#007a33", secondary: "#082416", accent: "#f0c75e", glow: "rgba(34,197,94,.55)", symbol: "BOS" },
  "Brooklyn Nets": { primary: "#f7f7f7", secondary: "#090909", accent: "#d6d6d6", glow: "rgba(255,255,255,.28)", symbol: "BKN" },
  "Charlotte Hornets": { primary: "#1d8cab", secondary: "#20105f", accent: "#c4ced4", glow: "rgba(29,140,171,.55)", symbol: "CHA" },
  "Chicago Bulls": { primary: "#ce1141", secondary: "#090909", accent: "#f7d782", glow: "rgba(206,17,65,.55)", symbol: "CHI" },
  "Cleveland Cavaliers": { primary: "#860038", secondary: "#041e42", accent: "#fdbb30", glow: "rgba(253,187,48,.46)", symbol: "CLE" },
  "Dallas Mavericks": { primary: "#00538c", secondary: "#002b5e", accent: "#b8c4ca", glow: "rgba(0,83,140,.55)", symbol: "DAL" },
  "Denver Nuggets": { primary: "#1d428a", secondary: "#0e2240", accent: "#fec524", glow: "rgba(254,197,36,.45)", symbol: "DEN" },
  "Detroit Pistons": { primary: "#c8102e", secondary: "#1d42ba", accent: "#bec0c2", glow: "rgba(200,16,46,.55)", symbol: "DET" },
  "Golden State Warriors": { primary: "#1d428a", secondary: "#002b5c", accent: "#ffc72c", glow: "rgba(255,199,44,.46)", symbol: "GSW" },
  "Houston Rockets": { primary: "#ce1141", secondary: "#090909", accent: "#c4ced4", glow: "rgba(206,17,65,.55)", symbol: "HOU" },
  "Indiana Pacers": { primary: "#fdbb30", secondary: "#002d62", accent: "#ffffff", glow: "rgba(253,187,48,.46)", symbol: "IND" },
  "Los Angeles Clippers": { primary: "#c8102e", secondary: "#1d428a", accent: "#bec0c2", glow: "rgba(29,66,138,.5)", symbol: "LAC" },
  "Los Angeles Lakers": { primary: "#552583", secondary: "#090909", accent: "#fdb927", glow: "rgba(253,185,39,.46)", symbol: "LAL" },
  "Memphis Grizzlies": { primary: "#5d76a9", secondary: "#12173f", accent: "#f5b112", glow: "rgba(93,118,169,.55)", symbol: "MEM" },
  "Miami Heat": { primary: "#98002e", secondary: "#090909", accent: "#f9a01b", glow: "rgba(249,160,27,.48)", symbol: "MIA" },
  "Milwaukee Bucks": { primary: "#00471b", secondary: "#0b2419", accent: "#eee1c6", glow: "rgba(0,113,51,.55)", symbol: "MIL" },
  "Minnesota Timberwolves": { primary: "#236192", secondary: "#0c2340", accent: "#78be20", glow: "rgba(120,190,32,.44)", symbol: "MIN" },
  "New Orleans Pelicans": { primary: "#85714d", secondary: "#0c2340", accent: "#c8102e", glow: "rgba(200,16,46,.45)", symbol: "NOP" },
  "New York Knicks": { primary: "#f58426", secondary: "#006bb6", accent: "#bec0c2", glow: "rgba(245,132,38,.48)", symbol: "NYK" },
  "Oklahoma City Thunder": { primary: "#007ac1", secondary: "#002d62", accent: "#ef3b24", glow: "rgba(0,122,193,.52)", symbol: "OKC" },
  "Orlando Magic": { primary: "#0077c0", secondary: "#090909", accent: "#c4ced4", glow: "rgba(0,119,192,.55)", symbol: "ORL" },
  "Philadelphia 76ers": { primary: "#006bb6", secondary: "#ed174c", accent: "#ffffff", glow: "rgba(0,107,182,.52)", symbol: "PHI" },
  "Phoenix Suns": { primary: "#e56020", secondary: "#1d1160", accent: "#f9ad1b", glow: "rgba(229,96,32,.5)", symbol: "PHX" },
  "Portland Trail Blazers": { primary: "#e03a3e", secondary: "#090909", accent: "#ffffff", glow: "rgba(224,58,62,.5)", symbol: "POR" },
  "Sacramento Kings": { primary: "#5a2d81", secondary: "#090909", accent: "#c4ced4", glow: "rgba(90,45,129,.55)", symbol: "SAC" },
  "San Antonio Spurs": { primary: "#c4ced4", secondary: "#090909", accent: "#ffffff", glow: "rgba(196,206,212,.34)", symbol: "SAS" },
  "Toronto Raptors": { primary: "#ce1141", secondary: "#090909", accent: "#a1a1a4", glow: "rgba(206,17,65,.55)", symbol: "TOR" },
  "Utah Jazz": { primary: "#fff21f", secondary: "#002b5c", accent: "#00a9e0", glow: "rgba(255,242,31,.38)", symbol: "UTA" },
  "Washington Wizards": { primary: "#e31837", secondary: "#002b5c", accent: "#c4ced4", glow: "rgba(227,24,55,.5)", symbol: "WAS" },
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const cardHtml = (coach) => {
  const theme = teamThemes[coach.teamName] ?? {
    primary: "#38bdf8",
    secondary: "#0f172a",
    accent: "#f6d36d",
    glow: "rgba(56,189,248,.42)",
    symbol: "NBA",
  };
  const team = teamLogos[coach.teamName] ?? { abbreviation: theme.symbol, logo: null };
  const logo = team.logo;
  const imageUrl = coachImages[coach.id];
  const longNameClass = coach.name.length > 23 ? "name long" : coach.name.length > 18 ? "name medium" : "name";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
*{box-sizing:border-box}html,body{margin:0;width:${cardWidth}px;height:${cardHeight}px;background:#000;overflow:hidden}
body{font-family:Inter,Arial,sans-serif;color:white}
.card{position:relative;width:${cardWidth}px;height:${cardHeight}px;overflow:hidden;border-radius:30px;background:#020407}
.base{position:absolute;inset:0;background:
radial-gradient(circle at 17% 18%, ${theme.glow}, transparent 30%),
radial-gradient(circle at 80% 8%, ${theme.primary}77, transparent 26%),
radial-gradient(circle at 54% 78%, ${theme.primary}30, transparent 44%),
linear-gradient(160deg, #01040a 0%, ${theme.secondary} 43%, #000 100%)}
.chalk{position:absolute;inset:0;background:url('${coachCardBackgroundImageUrl}') center/cover;opacity:.48;filter:grayscale(1) contrast(1.28);mix-blend-mode:screen}
.streaks{position:absolute;inset:0;background:
linear-gradient(118deg, transparent 4%, ${theme.primary}44 5%, transparent 7%, transparent 35%, ${theme.accent}2c 36%, transparent 38%, transparent 70%, ${theme.primary}38 71%, transparent 75%),
linear-gradient(24deg, transparent 62%, ${theme.accent}24 63%, transparent 66%)}
.ghost{position:absolute;left:-210px;top:295px;transform:rotate(-18deg);font-size:210px;font-weight:1000;letter-spacing:-18px;color:rgba(255,255,255,.045)}
.ghostLogo{position:absolute;right:-105px;bottom:150px;width:360px;height:360px;object-fit:contain;opacity:.07;filter:grayscale(1)}
.frame{position:absolute;inset:12px;border:5px solid #d4a642;border-radius:24px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.16), inset 0 0 44px rgba(246,211,109,.14),0 0 0 2px rgba(0,0,0,.8)}
.inner{position:absolute;inset:28px;border:1px solid rgba(255,255,255,.15);border-radius:18px}
.coachPill{position:absolute;left:65px;top:58px;height:54px;border:2px solid ${theme.accent};border-radius:15px;background:rgba(0,0,0,.58);padding:17px 28px 0;font-size:15px;font-weight:1000;text-transform:uppercase;letter-spacing:.34em}
.logo{position:absolute;right:72px;top:58px;width:145px;height:145px;border:3px solid ${theme.accent};border-radius:50%;padding:18px;background:radial-gradient(circle at 50% 34%, rgba(255,255,255,.18),rgba(0,0,0,.78)),${theme.secondary};box-shadow:0 24px 44px rgba(0,0,0,.56)}
.logo img{width:100%;height:100%;object-fit:contain}
.portrait{position:absolute;left:180px;right:90px;top:202px;height:475px;border:4px solid ${theme.accent};border-radius:26px;overflow:hidden;background:#111;box-shadow:0 28px 55px rgba(0,0,0,.64)}
.portrait img{width:100%;height:100%;object-fit:cover;object-position:top center;filter:saturate(.95) contrast(1.08)}
.portrait:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.03),transparent 44%,rgba(0,0,0,.56))}
.linkBadge{position:absolute;left:64px;top:432px;width:80px;height:80px;border:3px solid #a5ff68;border-radius:18px;background:rgba(58,156,37,.26);box-shadow:0 0 35px rgba(132,255,80,.58);display:grid;place-items:center}
.linkBadge svg{width:46px;height:46px;stroke:#dcffbf;stroke-width:2.6;fill:none;stroke-linecap:round;stroke-linejoin:round}
.leftSymbol{position:absolute;left:77px;top:535px;color:${theme.accent};font-size:62px;line-height:1;text-shadow:0 0 22px ${theme.glow}}
.ruleTop{position:absolute;left:180px;right:180px;top:703px;height:2px;background:linear-gradient(90deg,transparent,${theme.accent},transparent)}
.teamCode{position:absolute;left:0;right:0;top:718px;text-align:center;font-size:24px;font-weight:1000;color:${theme.primary};text-shadow:0 0 16px ${theme.glow}}
.name{position:absolute;left:92px;right:92px;top:756px;text-align:center;font-family:Impact,Arial Black,sans-serif;font-size:86px;font-weight:1000;line-height:.86;text-transform:uppercase;letter-spacing:-3px;text-shadow:0 12px 24px rgba(0,0,0,.96),0 0 18px rgba(255,255,255,.16)}
.name.medium{font-size:76px}.name.long{font-size:66px}
.ruleBottom{position:absolute;left:180px;right:180px;top:895px;height:2px;background:linear-gradient(90deg,transparent,${theme.accent},transparent)}
.boost{position:absolute;left:132px;right:132px;top:925px;border:3px solid ${theme.accent};border-radius:22px;background:rgba(0,0,0,.72);padding:15px 20px 20px;text-align:center;box-shadow:0 24px 48px rgba(0,0,0,.48)}
.boostLabel{font-size:15px;font-weight:1000;letter-spacing:.34em;color:${theme.accent};text-transform:uppercase}
.teamName{margin-top:13px;border:2px solid rgba(255,255,255,.28);border-radius:15px;background:rgba(255,255,255,.08);padding:15px 12px 13px;font-size:34px;font-weight:1000;letter-spacing:.16em;text-transform:uppercase}
.plus{margin-top:12px;border:2px solid rgba(163,255,110,.55);border-radius:14px;background:rgba(163,255,110,.13);padding:13px 10px 11px;color:#e6ffd1;font-size:26px;font-weight:1000;line-height:1.03;text-transform:uppercase;letter-spacing:.08em;box-shadow:0 0 24px rgba(132,255,80,.28)}
.footer{position:absolute;left:70px;right:70px;bottom:108px;display:grid;grid-template-columns:94px 1fr;gap:25px;align-items:center}
.footerIcon{width:94px;height:94px;border:3px solid ${theme.accent};border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 34%, ${theme.primary}99, rgba(0,0,0,.78));color:${theme.accent};font-size:28px;font-weight:1000}
.footerText{border-left:2px solid ${theme.accent};padding-left:24px}
.footerTitle{font-size:20px;font-weight:1000;color:${theme.accent};letter-spacing:.18em;text-transform:uppercase}
.footerBody{margin-top:8px;font-size:18px;line-height:1.18;font-weight:800;color:rgba(255,255,255,.9)}
</style>
</head>
<body>
<div class="card">
  <div class="base"></div><div class="chalk"></div><div class="streaks"></div><div class="ghost">${escapeHtml(theme.symbol)}</div>
  ${logo ? `<img class="ghostLogo" src="${logo}" />` : ""}
  <div class="frame"></div><div class="inner"></div>
  <div class="coachPill">Coach</div>
  <div class="logo">${logo ? `<img src="${logo}" />` : escapeHtml(team.abbreviation)}</div>
  <div class="portrait">${imageUrl ? `<img src="${imageUrl}" />` : escapeHtml(coach.name)}</div>
  <div class="linkBadge"><svg viewBox="0 0 24 24"><path d="m11 17 2 2a2.8 2.8 0 0 0 4 0l3-3a2.8 2.8 0 0 0 0-4l-2-2"/><path d="m13 7-2-2a2.8 2.8 0 0 0-4 0l-3 3a2.8 2.8 0 0 0 0 4l2 2"/><path d="m8 12 8 0"/></svg></div>
  <div class="leftSymbol">${coach.teamName === "Boston Celtics" ? "♣" : "✦"}</div>
  <div class="ruleTop"></div><div class="teamCode">${escapeHtml(theme.symbol)}</div>
  <div class="${longNameClass}">${escapeHtml(coach.name)}</div>
  <div class="ruleBottom"></div>
  <div class="boost"><div class="boostLabel">Team Boost</div><div class="teamName">${escapeHtml(coach.teamName)}</div><div class="plus">+1 OVR to matching players</div></div>
  <div class="footer"><div class="footerIcon">${escapeHtml(theme.symbol)}</div><div class="footerText"><div class="footerTitle">Coach Link</div><div class="footerBody">${escapeHtml(coach.teamName)} players gain +1 Overall when ${escapeHtml(coach.name)} is your coach.</div></div></div>
</div>
</body>
</html>`;
};

for (const coach of coaches) {
  const htmlPath = resolve(tempDir, `${coach.id}.html`);
  const pngPath = resolve(outputDir, `${coach.id}.png`);
  writeFileSync(htmlPath, cardHtml(coach), "utf8");
  execFileSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--default-background-color=000000",
    "--allow-file-access-from-files",
    `--window-size=${cardWidth},${cardHeight}`,
    `--screenshot=${pngPath}`,
    `file:///${htmlPath.replace(/\\/g, "/")}`,
  ], { stdio: "pipe" });
  console.log(`Generated ${pngPath}`);
}
