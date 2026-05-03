import { bigThrees, dynamicDuos, rivalBadges, teamChemistryGroups } from "./dynamicDuos";

export const COLLECTION_REWARD_TOKENS = 25_000;

export type CollectionFamilyId = "dynamic-duos" | "big-threes" | "rivals" | "team-chemistry";

export interface CollectionFamilyDefinition {
  id: CollectionFamilyId;
  title: string;
  description: string;
  rewardText: string;
  toneClass: string;
}

export interface CollectionEntry {
  id: string;
  title: string;
  playerIds: string[];
  requiredCount?: number;
}

export const collectionFamilies: CollectionFamilyDefinition[] = [
  {
    id: "dynamic-duos",
    title: "Dynamic Duos",
    description: "Collect every Dynamic Duo by drafting both players together in Rogue Mode.",
    rewardText: "Complete the full set to claim 25,000 Tokens.",
    toneClass: "border-sky-300/20 bg-sky-300/10",
  },
  {
    id: "big-threes",
    title: "Big 3s",
    description: "Complete every Big 3 trio across eras and franchise cores in Rogue Mode.",
    rewardText: "Complete the full set to claim 25,000 Tokens.",
    toneClass: "border-fuchsia-300/20 bg-fuchsia-300/10",
  },
  {
    id: "rivals",
    title: "Rivals",
    description: "Draft every rivalry pairing together in Rogue Mode and finish the full set.",
    rewardText: "Complete the full set to claim 25,000 Tokens.",
    toneClass: "border-rose-300/20 bg-rose-300/10",
  },
  {
    id: "team-chemistry",
    title: "Team Chemistry",
    description: "Activate every historical Team Chemistry group in Rogue Mode.",
    rewardText: "Complete the full set to claim 25,000 Tokens.",
    toneClass: "border-amber-300/20 bg-amber-300/10",
  },
];

export const getCollectionEntries = (familyId: CollectionFamilyId): CollectionEntry[] => {
  switch (familyId) {
    case "dynamic-duos":
      return dynamicDuos.map((entry) => ({
        id: entry.id,
        title: entry.title.replace("Dynamic Duos: ", ""),
        playerIds: entry.players,
      }));
    case "big-threes":
      return bigThrees.map((entry) => ({
        id: entry.id,
        title: entry.title.replace("Big 3: ", ""),
        playerIds: entry.players,
      }));
    case "rivals":
      return rivalBadges.map((entry) => ({
        id: entry.id,
        title: entry.title.replace("Rivals: ", ""),
        playerIds: entry.players,
      }));
    case "team-chemistry":
      return teamChemistryGroups.map((entry) => ({
        id: entry.id,
        title: `${entry.nickname} (${entry.teamName})`,
        playerIds: entry.eligiblePlayers,
        requiredCount: 2,
      }));
  }
};

const getCollectionEntryKey = (familyId: CollectionFamilyId, entryId: string) => `${familyId}:${entryId}`;

export const getRogueCollectionEntryIdsForRoster = (playerIds: string[]) => {
  const owned = new Set(playerIds);

  return collectionFamilies.flatMap((family) =>
    getCollectionEntries(family.id)
      .filter((entry) => {
        const requiredCount = entry.requiredCount ?? entry.playerIds.length;
        return entry.playerIds.filter((playerId) => owned.has(playerId)).length >= requiredCount;
      })
      .map((entry) => getCollectionEntryKey(family.id, entry.id)),
  );
};

export const buildCollectionProgress = (collectedEntryIds: string[]) => {
  const collectedIds = new Set(collectedEntryIds);

  return collectionFamilies.map((family) => {
    const items = getCollectionEntries(family.id).map((entry) => ({
      ...entry,
      collected: collectedIds.has(getCollectionEntryKey(family.id, entry.id)),
    }));

    return {
      family,
      items,
      collectedCount: items.filter((entry) => entry.collected).length,
      totalCount: items.length,
      unlocked: items.length > 0 && items.every((entry) => entry.collected),
    };
  });
};
