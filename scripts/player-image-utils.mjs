import { readFile, writeFile } from "node:fs/promises";

export const repoRoot = new URL("../", import.meta.url);
export const playersFileUrl = new URL("../src/data/players.ts", import.meta.url);
export const currentSeasonPlayersFileUrl = new URL("../src/data/players-current-2026.ts", import.meta.url);
export const playerImagesFileUrl = new URL("../src/lib/playerImages.ts", import.meta.url);
export const draftGameHookFileUrl = new URL("../src/hooks/useDraftGame.ts", import.meta.url);

export const toPlayerId = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const getBasePlayerIdFromName = (name) =>
  toPlayerId(name.replace(/\s*\([^)]*\)\s*$/, "").trim());

export const getObjectBlock = (fileContent, objectName) => {
  const startToken = `const ${objectName}`;
  const startIndex = fileContent.indexOf(startToken);
  if (startIndex === -1) {
    throw new Error(`Could not find ${objectName} in target file.`);
  }

  const openBraceIndex = fileContent.indexOf("{", startIndex);
  if (openBraceIndex === -1) {
    throw new Error(`Could not find opening brace for ${objectName}.`);
  }

  let depth = 0;
  let closeBraceIndex = -1;
  for (let index = openBraceIndex; index < fileContent.length; index += 1) {
    const character = fileContent[index];
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        closeBraceIndex = index;
        break;
      }
    }
  }

  if (closeBraceIndex === -1) {
    throw new Error(`Could not find closing brace for ${objectName}.`);
  }

  return {
    startIndex,
    openBraceIndex,
    closeBraceIndex,
    body: fileContent.slice(openBraceIndex + 1, closeBraceIndex),
  };
};

export const parseQuotedKeyValuePairs = (objectBody) => {
  const pairs = [];
  const pairRegex = /"([^"]+)":\s*"([^"]+)",/g;
  let match = pairRegex.exec(objectBody);
  while (match) {
    pairs.push({ key: match[1], value: match[2], index: match.index });
    match = pairRegex.exec(objectBody);
  }
  return pairs;
};

export const readPlayerCatalog = async () => {
  const files = [playersFileUrl, currentSeasonPlayersFileUrl];
  const players = [];

  for (const fileUrl of files) {
    const content = await readFile(fileUrl, "utf8");
    const nameRegex = /name:\s*"([^"]+)"/g;
    let match = nameRegex.exec(content);
    while (match) {
      const name = match[1];
      players.push({
        name,
        id: toPlayerId(name),
        baseId: getBasePlayerIdFromName(name),
      });
      match = nameRegex.exec(content);
    }
  }

  return players;
};

export const readLegacyPlayerIdMigrationKeys = async () => {
  const content = await readFile(draftGameHookFileUrl, "utf8");
  const block = getObjectBlock(content, "LEGACY_PLAYER_ID_MIGRATIONS");
  return new Set(parseQuotedKeyValuePairs(block.body).map(({ key }) => key));
};

export const readDirectImageOverrides = async () => {
  const content = await readFile(playerImagesFileUrl, "utf8");
  const block = getObjectBlock(content, "directImageOverrides");
  return {
    content,
    ...block,
    pairs: parseQuotedKeyValuePairs(block.body),
  };
};

export const writePlayerImagesContent = async (nextContent) => {
  await writeFile(playerImagesFileUrl, nextContent, "utf8");
};

export const findPlayersByName = (players, requestedName) => {
  const lowered = requestedName.trim().toLowerCase();
  const exactMatches = players.filter((player) => player.name.toLowerCase() === lowered);
  if (exactMatches.length) return exactMatches;

  return players.filter((player) => player.name.toLowerCase().includes(lowered));
};
