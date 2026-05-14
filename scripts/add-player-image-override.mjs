import {
  findPlayersByName,
  readDirectImageOverrides,
  readPlayerCatalog,
  writePlayerImagesContent,
} from "./player-image-utils.mjs";

const usage = () => {
  console.log('Usage: npm run add:image-override -- "Player Name" "https://image-url"');
};

const [playerName, imageUrl] = process.argv.slice(2);

if (!playerName || !imageUrl) {
  usage();
  process.exit(1);
}

const main = async () => {
  const players = await readPlayerCatalog();
  const matches = findPlayersByName(players, playerName);

  if (matches.length === 0) {
    throw new Error(`Could not find a player matching "${playerName}".`);
  }

  if (matches.length > 1) {
    const uniqueNames = Array.from(new Set(matches.map((player) => `${player.name} -> ${player.id}`)));
    throw new Error(
      `Multiple player matches found for "${playerName}". Please use one of these exact names:\n${uniqueNames
        .map((entry) => `- ${entry}`)
        .join("\n")}`,
    );
  }

  const player = matches[0];
  const { content, openBraceIndex, closeBraceIndex, pairs } = await readDirectImageOverrides();
  const existingPair = pairs.find(({ key }) => key === player.id);
  const entryText = `  "${player.id}":\n    "${imageUrl}",`;

  let nextContent = content;

  if (existingPair) {
    const entryRegex = new RegExp(`^\\s*"${player.id.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}":\\s*\\n\\s*"[^"]+",\\r?$`, "m");
    if (!entryRegex.test(content)) {
      throw new Error(`Could not safely replace existing override for ${player.id}.`);
    }
    nextContent = content.replace(entryRegex, entryText);
  } else {
    const beforeClose = content.slice(0, closeBraceIndex).replace(/\r?\n?$/, "\n");
    const afterClose = content.slice(closeBraceIndex);
    nextContent = `${beforeClose}${entryText}\n${afterClose}`;
  }

  await writePlayerImagesContent(nextContent);
  console.log(`Updated image override for ${player.name} using exact id ${player.id}.`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
