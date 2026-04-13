import { Player } from "../types";

const DISPLAY_NAME_MIGRATIONS: Record<string, string> = {
  "Dwyane Wade (Young)": "Dwayne Wade ('03 - '10)",
  "Dwyane Wade (Big 3)": "Dwayne Wade ('10 - '14)",
};

const VERSION_SUFFIX_PATTERN = /\s(\('[0-9]{2}\s-\s'[0-9]{2}\)|\([^)]*\))$/;

export const getCanonicalPlayerDisplayName = (player: Player) =>
  DISPLAY_NAME_MIGRATIONS[player.name] ?? player.name;

export const getPlayerDisplayLines = (player: Player) => {
  const displayName = getCanonicalPlayerDisplayName(player).trim();
  const versionMatch = displayName.match(VERSION_SUFFIX_PATTERN);
  const versionLine = versionMatch?.[1] ?? "";
  const baseName = versionMatch ? displayName.slice(0, -versionLine.length).trim() : displayName;
  const nameParts = baseName.split(" ");
  const firstNameLine = nameParts.slice(0, -1).join(" ") || baseName;
  const lastNameLine = nameParts.slice(-1)[0] ?? "";

  return {
    displayName,
    firstNameLine,
    lastNameLine,
    versionLine,
  };
};
