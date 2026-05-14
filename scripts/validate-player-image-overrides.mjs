import {
  getBasePlayerIdFromName,
  readDirectImageOverrides,
  readLegacyPlayerIdMigrationKeys,
  readPlayerCatalog,
} from "./player-image-utils.mjs";

const SPECIAL_KEY_PREFIXES = ["btg-"];

const main = async () => {
  const players = await readPlayerCatalog();
  const legacyMigrationKeys = await readLegacyPlayerIdMigrationKeys();
  const { pairs } = await readDirectImageOverrides();

  const validExactIds = new Set(players.map((player) => player.id));
  const validBaseIds = new Set(players.map((player) => getBasePlayerIdFromName(player.name)));
  const orphanedKeys = pairs
    .map(({ key }) => key)
    .filter((key) => {
      if (SPECIAL_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) return false;
      if (validExactIds.has(key)) return false;
      if (validBaseIds.has(key)) return false;
      if (legacyMigrationKeys.has(key)) return false;
      return true;
    });

  if (orphanedKeys.length) {
    console.error("Found player image override keys that do not match any live player id, base id, or legacy migration key:");
    orphanedKeys.forEach((key) => console.error(`- ${key}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Player image override validation passed for ${pairs.length} override keys.`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
