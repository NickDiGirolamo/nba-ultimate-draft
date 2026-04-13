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
  { id: "heat-shaq-wade", title: "Dynamic Duos: Heat Shaq + Wade", type: "dynamic-duo", players: ["shaquille-o-neal-heat", "dwayne-wade-03-10"] },
  { id: "kobe-shaq", title: "Dynamic Duos: Kobe + Shaq", type: "dynamic-duo", players: ["kobe-bryant-8", "shaquille-o-neal-lakers"] },
  { id: "payton-kemp", title: "Dynamic Duos: Payton + Kemp", type: "dynamic-duo", players: ["gary-payton", "shawn-kemp"] },
  { id: "nash-amare", title: "Dynamic Duos: Nash + Amar'e", type: "dynamic-duo", players: ["steve-nash", "amar-e-stoudemire"] },
  { id: "cp3-west", title: "Dynamic Duos: Chris Paul + David West", type: "dynamic-duo", players: ["chris-paul-hornets", "david-west"] },
  { id: "cp3-blake", title: "Dynamic Duos: Chris Paul + Blake Griffin", type: "dynamic-duo", players: ["chris-paul-clippers", "blake-griffin"] },
  { id: "deron-boozer", title: "Dynamic Duos: Deron + Boozer", type: "dynamic-duo", players: ["deron-williams", "carlos-boozer"] },
  { id: "giannis-khris", title: "Dynamic Duos: Giannis + Khris", type: "dynamic-duo", players: ["giannis-antetokounmpo", "khris-middleton"] },
  { id: "kd-russ", title: "Dynamic Duos: KD + Russ", type: "dynamic-duo", players: ["kevin-durant-thunder", "russell-westbrook"] },
  { id: "wall-beal", title: "Dynamic Duos: Wall + Beal", type: "dynamic-duo", players: ["john-wall", "bradley-beal"] },
  { id: "stockton-malone", title: "Dynamic Duos: Stockton + Malone", type: "dynamic-duo", players: ["john-stockton", "karl-malone"] },
  { id: "grit-grind", title: "Dynamic Duos: Randolph + Gasol", type: "dynamic-duo", players: ["zach-randolph", "marc-gasol"] },
  { id: "lebron-kyrie", title: "Dynamic Duos: LeBron + Kyrie", type: "dynamic-duo", players: ["lebron-james-14-18", "kyrie-irving"] },
  { id: "jordan-pippen", title: "Dynamic Duos: Jordan + Pippen", type: "dynamic-duo", players: ["michael-jordan", "scottie-pippen"] },
  { id: "magic-kareem", title: "Dynamic Duos: Magic + Kareem", type: "dynamic-duo", players: ["magic-johnson", "kareem-abdul-jabbar-lakers"] },
  { id: "jokic-murray", title: "Dynamic Duos: Jokic + Murray", type: "dynamic-duo", players: ["nikola-jokic", "jamal-murray"] },
  { id: "tatum-brown", title: "Dynamic Duos: Tatum + Brown", type: "dynamic-duo", players: ["jayson-tatum", "jaylen-brown"] },
  { id: "steph-klay", title: "Dynamic Duos: Steph + Klay", type: "dynamic-duo", players: ["steph-curry", "klay-thompson"] },
  { id: "tmac-vince", title: "Dynamic Duos: T-Mac + Vince", type: "dynamic-duo", players: ["tracy-mcgrady-raptors", "vince-carter-raptors"] },
  { id: "tmac-yao", title: "Dynamic Duos: T-Mac + Yao", type: "dynamic-duo", players: ["tracy-mcgrady-rockets", "yao-ming"] },
  { id: "duncan-robinson", title: "Dynamic Duos: Duncan + Robinson", type: "dynamic-duo", players: ["tim-duncan", "david-robinson"] },
  { id: "bucks-kareem-oscar", title: "Dynamic Duos: Kareem + Oscar", type: "dynamic-duo", players: ["kareem-abdul-jabbar-bucks", "oscar-robertson"] },
  { id: "penny-shaq", title: "Dynamic Duos: Penny + Shaq", type: "dynamic-duo", players: ["penny-hardaway", "shaquille-o-neal-magic"] },
  { id: "kobe-pau", title: "Dynamic Duos: Kobe + Pau", type: "dynamic-duo", players: ["kobe-bryant-24", "pau-gasol"] },
];

export const bigThrees: PlayerBadgeDefinition[] = [
  { id: "spurs-big-three", title: "Big 3: Spurs Core", type: "big-3", players: ["tim-duncan", "tony-parker", "manu-ginobili"] },
  { id: "celtics-big-three", title: "Big 3: Celtics Core", type: "big-3", players: ["ray-allen-celtics", "paul-pierce", "kevin-garnett-celtics"] },
  { id: "heat-big-three", title: "Big 3: Heat Core", type: "big-3", players: ["dwayne-wade-10-14", "chris-bosh", "lebron-james-heat"] },
  { id: "bulls-big-three", title: "Big 3: Bulls Core", type: "big-3", players: ["michael-jordan", "scottie-pippen", "dennis-rodman"] },
  { id: "warriors-big-three", title: "Big 3: Warriors Core", type: "big-3", players: ["steph-curry", "klay-thompson", "draymond-green"] },
  { id: "run-tmc", title: "Big 3: Run TMC", type: "big-3", players: ["tim-hardaway", "mitch-richmond", "chris-mullin"] },
];

export const rivalBadges: PlayerBadgeDefinition[] = [
  {
    id: "lebron-steph-rivals",
    title: "Rivals: LeBron vs Steph",
    type: "rival",
    players: ["lebron-james-14-18", "steph-curry"],
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
