import { allPlayers } from "../data/players";
import { getNbaTeamByName } from "../data/nbaTeams";
import { Player } from "../types";

const playerById = new Map(allPlayers.map((player) => [player.id, player]));

const getCanonicalTeamKey = (teamLabel: string) => getNbaTeamByName(teamLabel)?.name ?? null;

export const getPlayerTeamKey = (player: Player | null | undefined) =>
  player ? getCanonicalTeamKey(player.teamLabel) : null;

const getTeamCountsFromPlayerIds = (playerIds: string[]) => {
  const seenPlayerIds = new Set<string>();
  const counts = new Map<string, number>();

  playerIds.forEach((playerId) => {
    if (seenPlayerIds.has(playerId)) return;
    seenPlayerIds.add(playerId);

    const player = playerById.get(playerId);
    const teamKey = getPlayerTeamKey(player);
    if (!teamKey) return;

    counts.set(teamKey, (counts.get(teamKey) ?? 0) + 1);
  });

  return counts;
};

export const getSameTeamChemistryBonusForPlayer = (
  player: Player | null | undefined,
  playerIds: string[],
) => {
  const teamKey = getPlayerTeamKey(player);
  if (!teamKey) return 0;

  const teamCounts = getTeamCountsFromPlayerIds(playerIds);
  return (teamCounts.get(teamKey) ?? 0) >= 2 ? 1 : 0;
};

export const isSameTeamChemistryActiveForPlayer = (
  player: Player | null | undefined,
  playerIds: string[],
) => getSameTeamChemistryBonusForPlayer(player, playerIds) > 0;

export const isSameTeamChemistryPreviewActiveForPlayer = (
  player: Player | null | undefined,
  playerIds: string[],
) => {
  if (!player) return false;

  const previewIds = playerIds.includes(player.id) ? playerIds : [...playerIds, player.id];
  return getSameTeamChemistryBonusForPlayer(player, previewIds) > 0;
};
