import { currentSeasonHeadshotUrls } from "../data/current-season-headshots";
import { Player } from "../types";

export const isCurrentSeasonCard = (player: Player) =>
  Boolean(currentSeasonHeadshotUrls[player.id]) || player.era === "2025-26";
