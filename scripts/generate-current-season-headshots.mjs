import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const currentSeasonPlayersPath = path.join(
  projectRoot,
  "src",
  "data",
  "players-current-2026.ts",
);
const nbaApiDataPath = path.join(projectRoot, "temp-nba-api-data.py");
const outputPath = path.join(
  projectRoot,
  "src",
  "data",
  "current-season-headshots.ts",
);

const currentSeasonSource = fs.readFileSync(currentSeasonPlayersPath, "utf8");
const nbaApiSource = fs.readFileSync(nbaApiDataPath, "utf8");

const playerEntries = [
  ...currentSeasonSource.matchAll(
    /makePlayer\(\{\s*name: "([^"]+)",[\s\S]*?\}\)/g,
  ),
].map((match) => {
  const block = match[0];
  const name = match[1];
  const id =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return { id, name };
});

const nbaPlayers = [
  ...nbaApiSource.matchAll(
    /\[(\d+),\s*"([^"]*)",\s*"([^"]*)",\s*"([^"]*)",\s*(True|False)\]/g,
  ),
].map((match) => ({
  nbaId: Number(match[1]),
  fullName: match[4],
  isActive: match[5] === "True",
}));

const replacements = [
  ["Ã¼", "ü"],
  ["Ã¶", "ö"],
  ["Ã¤", "ä"],
  ["Ã³", "ó"],
  ["Ã¡", "á"],
  ["Ã©", "é"],
  ["Ã±", "ñ"],
  ["Ã§", "ç"],
  ["Ã¨", "è"],
  ["Ãª", "ê"],
  ["Ã«", "ë"],
  ["Ã®", "î"],
  ["Ã¯", "ï"],
  ["Ã´", "ô"],
  ["Ã»", "û"],
  ["Ãº", "ú"],
  ["Ã­", "í"],
  ["Å¡", "š"],
  ["Å ", "Š"],
  ["Ä‡", "ć"],
  ["Ä�", "č"],
  ["Å¾", "ž"],
  ["Å½", "Ž"],
  ["ё", "e"],
];

const fixMojibake = (value) =>
  replacements.reduce(
    (accumulator, [from, to]) => accumulator.split(from).join(to),
    value,
  );

const normalizeName = (value) =>
  fixMojibake(value)
    .replace(/\s*\(2025-26\)$/, "")
    .replace(/\./g, "")
    .replace(/\bII\b|\bIII\b|\bIV\b/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();

const activeNbaPlayers = nbaPlayers.filter((player) => player.isActive);
const nbaLookup = new Map(
  activeNbaPlayers.map((player) => [normalizeName(player.fullName), player]),
);

const headshotMap = {};
const unmatchedPlayers = [];

for (const player of playerEntries) {
  const match = nbaLookup.get(normalizeName(player.name));

  if (!match) {
    unmatchedPlayers.push(player.name);
    continue;
  }

  headshotMap[player.id] =
    `https://cdn.nba.com/headshots/nba/latest/1040x760/${match.nbaId}.png`;
}

const output = `export const currentSeasonHeadshotUrls: Record<string, string> = ${JSON.stringify(
  headshotMap,
  null,
  2,
)};\n`;

fs.writeFileSync(outputPath, output);

console.log(
  `Generated ${Object.keys(headshotMap).length} official current-season headshots.`,
);
if (unmatchedPlayers.length > 0) {
  console.log("Unmatched current-season players:");
  unmatchedPlayers.forEach((player) => console.log(`- ${player}`));
}
