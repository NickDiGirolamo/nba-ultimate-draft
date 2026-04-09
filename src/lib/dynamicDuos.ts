import { Player } from "../types";

export interface DynamicDuo {
  id: string;
  title: string;
  players: [string, string];
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
  durability: 0,
  ballDominance: 1,
  interiorDefense: 1,
  perimeterDefense: 1,
} as const;

export const dynamicDuos: DynamicDuo[] = [
  {
    id: "wade-lebron",
    title: "Dynamic Duos: Wade + LeBron",
    players: ["dwyane-wade", "lebron-james"],
  },
  {
    id: "kobe-shaq",
    title: "Dynamic Duos: Kobe + Shaq",
    players: ["kobe-bryant", "shaquille-o-neal"],
  },
  {
    id: "nash-amare",
    title: "Dynamic Duos: Nash + Amar'e",
    players: ["steve-nash", "amar-e-stoudemire"],
  },
  {
    id: "stockton-malone",
    title: "Dynamic Duos: Stockton + Malone",
    players: ["john-stockton", "karl-malone"],
  },
  {
    id: "jordan-pippen",
    title: "Dynamic Duos: Jordan + Pippen",
    players: ["michael-jordan", "scottie-pippen"],
  },
  {
    id: "magic-kareem",
    title: "Dynamic Duos: Magic + Kareem",
    players: ["magic-johnson", "kareem-abdul-jabbar"],
  },
  {
    id: "steph-klay",
    title: "Dynamic Duos: Steph + Klay",
    players: ["steph-curry", "klay-thompson"],
  },
  {
    id: "tmac-yao",
    title: "Dynamic Duos: T-Mac + Yao",
    players: ["tracy-mcgrady", "yao-ming"],
  },
  {
    id: "duncan-parker",
    title: "Dynamic Duos: Duncan + Parker",
    players: ["tim-duncan", "tony-parker"],
  },
];

export const getPlayerDynamicDuo = (playerId: string) =>
  dynamicDuos.find((duo) => duo.players.includes(playerId));

export const getActiveDynamicDuos = (playerIds: string[]) => {
  const owned = new Set(playerIds);
  return dynamicDuos.filter((duo) => duo.players.every((playerId) => owned.has(playerId)));
};

export const isDynamicDuoActiveForPlayer = (playerId: string, playerIds: string[]) =>
  getActiveDynamicDuos(playerIds).some((duo) => duo.players.includes(playerId));

export const applyDynamicDuoBonuses = (players: Player[]) => {
  const activeDuos = getActiveDynamicDuos(players.map((player) => player.id));
  if (activeDuos.length === 0) return players;

  const boostedIds = new Set(activeDuos.flatMap((duo) => duo.players));

  return players.map((player) =>
    boostedIds.has(player.id)
      ? {
          ...player,
          overall: Math.min(99, player.overall + duoStatBoost.overall),
          offense: Math.min(99, player.offense + duoStatBoost.offense),
          defense: Math.min(99, player.defense + duoStatBoost.defense),
          playmaking: Math.min(99, player.playmaking + duoStatBoost.playmaking),
          shooting: Math.min(99, player.shooting + duoStatBoost.shooting),
          rebounding: Math.min(99, player.rebounding + duoStatBoost.rebounding),
          athleticism: Math.min(99, player.athleticism + duoStatBoost.athleticism),
          intangibles: Math.min(99, player.intangibles + duoStatBoost.intangibles),
          ballDominance: Math.min(99, player.ballDominance + duoStatBoost.ballDominance),
          interiorDefense: Math.min(99, player.interiorDefense + duoStatBoost.interiorDefense),
          perimeterDefense: Math.min(99, player.perimeterDefense + duoStatBoost.perimeterDefense),
        }
      : player,
  );
};
