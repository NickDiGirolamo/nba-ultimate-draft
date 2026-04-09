import { Player } from "../types";

export type PlayerBadgeType = "dynamic-duo" | "big-3" | "rival";

export interface PlayerBadgeDefinition {
  id: string;
  title: string;
  type: PlayerBadgeType;
  players: string[];
}

const duoStatBoost = {
  overall: 1,
  offense: 2,
  defense: 1,
  playmaking: 2,
  shooting: 2,
  rebounding: 1,
  athleticism: 1,
  intangibles: 2,
  ballDominance: 1,
  interiorDefense: 1,
  perimeterDefense: 1,
} as const;

const bigThreeStatBoost = {
  overall: 2,
  offense: 3,
  defense: 2,
  playmaking: 2,
  shooting: 2,
  rebounding: 2,
  athleticism: 1,
  intangibles: 3,
  ballDominance: 2,
  interiorDefense: 2,
  perimeterDefense: 2,
} as const;

export const dynamicDuos: PlayerBadgeDefinition[] = [
  { id: "wade-lebron", title: "Dynamic Duos: Wade + LeBron", type: "dynamic-duo", players: ["dwyane-wade", "lebron-james"] },
  { id: "kobe-shaq", title: "Dynamic Duos: Kobe + Shaq", type: "dynamic-duo", players: ["kobe-bryant", "shaquille-o-neal"] },
  { id: "payton-kemp", title: "Dynamic Duos: Payton + Kemp", type: "dynamic-duo", players: ["gary-payton", "shawn-kemp"] },
  { id: "nash-amare", title: "Dynamic Duos: Nash + Amar'e", type: "dynamic-duo", players: ["steve-nash", "amar-e-stoudemire"] },
  { id: "stockton-malone", title: "Dynamic Duos: Stockton + Malone", type: "dynamic-duo", players: ["john-stockton", "karl-malone"] },
  { id: "jordan-pippen", title: "Dynamic Duos: Jordan + Pippen", type: "dynamic-duo", players: ["michael-jordan", "scottie-pippen"] },
  { id: "magic-kareem", title: "Dynamic Duos: Magic + Kareem", type: "dynamic-duo", players: ["magic-johnson", "kareem-abdul-jabbar"] },
  { id: "steph-klay", title: "Dynamic Duos: Steph + Klay", type: "dynamic-duo", players: ["steph-curry", "klay-thompson"] },
  { id: "tmac-yao", title: "Dynamic Duos: T-Mac + Yao", type: "dynamic-duo", players: ["tracy-mcgrady", "yao-ming"] },
  { id: "duncan-parker", title: "Dynamic Duos: Duncan + Parker", type: "dynamic-duo", players: ["tim-duncan", "tony-parker"] },
];

export const bigThrees: PlayerBadgeDefinition[] = [
  { id: "spurs-big-three", title: "Big 3: Spurs Core", type: "big-3", players: ["tim-duncan", "tony-parker", "manu-ginobili"] },
  { id: "celtics-big-three", title: "Big 3: Celtics Core", type: "big-3", players: ["kevin-garnett", "paul-pierce", "rajon-rondo"] },
  { id: "heat-big-three", title: "Big 3: Heat Core", type: "big-3", players: ["dwyane-wade", "chris-bosh", "lebron-james"] },
  { id: "bulls-big-three", title: "Big 3: Bulls Core", type: "big-3", players: ["michael-jordan", "scottie-pippen", "dennis-rodman"] },
];

export const rivalBadges: PlayerBadgeDefinition[] = [
  {
    id: "lebron-steph-rivals",
    title: "Rivals: LeBron vs Steph",
    type: "rival",
    players: ["lebron-james", "steph-curry"],
  },
  {
    id: "bird-magic-rivals",
    title: "Rivals: Bird vs Magic",
    type: "rival",
    players: ["larry-bird", "magic-johnson"],
  },
  {
    id: "wilt-russell-rivals",
    title: "Rivals: Wilt vs Russell",
    type: "rival",
    players: ["wilt-chamberlain", "bill-russell"],
  },
];

export const playerBadges: PlayerBadgeDefinition[] = [...dynamicDuos, ...bigThrees, ...rivalBadges];

const getActiveBadges = (badges: PlayerBadgeDefinition[], playerIds: string[]) => {
  const owned = new Set(playerIds);
  return badges.filter((badge) => badge.players.every((playerId) => owned.has(playerId)));
};

export const getPlayerDynamicDuo = (playerId: string) =>
  dynamicDuos.find((duo) => duo.players.includes(playerId));

export const getActiveDynamicDuos = (playerIds: string[]) => getActiveBadges(dynamicDuos, playerIds);

export const getActiveBigThrees = (playerIds: string[]) => getActiveBadges(bigThrees, playerIds);

export const getPlayerBadgeStates = (playerId: string, playerIds: string[]) => {
  const owned = new Set(playerIds);

  return playerBadges
    .filter((badge) => badge.players.includes(playerId))
    .map((definition) => ({
      definition,
      active: definition.players.every((memberId) => owned.has(memberId)),
    }));
};

export const isDynamicDuoActiveForPlayer = (playerId: string, playerIds: string[]) =>
  getActiveDynamicDuos(playerIds).some((duo) => duo.players.includes(playerId));

const applyBoost = (
  players: Player[],
  activeGroups: PlayerBadgeDefinition[],
  boost: typeof duoStatBoost | typeof bigThreeStatBoost,
) => {
  if (activeGroups.length === 0) return players;

  const boostedIds = new Set(activeGroups.flatMap((group) => group.players));

  return players.map((player) =>
    boostedIds.has(player.id)
      ? {
          ...player,
          overall: Math.min(99, player.overall + boost.overall),
          offense: Math.min(99, player.offense + boost.offense),
          defense: Math.min(99, player.defense + boost.defense),
          playmaking: Math.min(99, player.playmaking + boost.playmaking),
          shooting: Math.min(99, player.shooting + boost.shooting),
          rebounding: Math.min(99, player.rebounding + boost.rebounding),
          athleticism: Math.min(99, player.athleticism + boost.athleticism),
          intangibles: Math.min(99, player.intangibles + boost.intangibles),
          ballDominance: Math.min(99, player.ballDominance + boost.ballDominance),
          interiorDefense: Math.min(99, player.interiorDefense + boost.interiorDefense),
          perimeterDefense: Math.min(99, player.perimeterDefense + boost.perimeterDefense),
        }
      : player,
  );
};

export const applyDynamicDuoBonuses = (players: Player[]) =>
  applyBoost(players, getActiveDynamicDuos(players.map((player) => player.id)), duoStatBoost);

export const applyBigThreeBonuses = (players: Player[]) =>
  applyBoost(players, getActiveBigThrees(players.map((player) => player.id)), bigThreeStatBoost);

export const applySynergyBonuses = (players: Player[]) =>
  applyBigThreeBonuses(applyDynamicDuoBonuses(players));
