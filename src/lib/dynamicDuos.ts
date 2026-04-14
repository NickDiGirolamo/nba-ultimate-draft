import { Player } from "../types";

export type PlayerBadgeType =
  | "dynamic-duo"
  | "big-3"
  | "rival"
  | "role-player"
  | "centerpiece";

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

const rolePlayerStatBoost = {
  overall: 0,
  offense: 1,
  defense: 1,
  playmaking: 1,
  shooting: 1,
  rebounding: 1,
  athleticism: 0,
  intangibles: 1,
  ballDominance: 0,
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

interface RolePlayerPairDefinition {
  id: string;
  title: string;
  centerpiece: string;
  rolePlayer: string;
}

export const dynamicDuos: PlayerBadgeDefinition[] = [
  { id: "heat-shaq-wade", title: "Dynamic Duos: Heat Shaq + Wade", type: "dynamic-duo", players: ["shaquille-o-neal-heat", "dwayne-wade-03-10"] },
  { id: "kobe-shaq", title: "Dynamic Duos: Kobe + Shaq", type: "dynamic-duo", players: ["kobe-bryant-8", "shaquille-o-neal-lakers"] },
  { id: "payton-kemp", title: "Dynamic Duos: Payton + Kemp", type: "dynamic-duo", players: ["gary-payton", "shawn-kemp"] },
  { id: "nash-amare", title: "Dynamic Duos: Nash + Amar'e", type: "dynamic-duo", players: ["steve-nash", "amar-e-stoudemire"] },
  { id: "heat-lebron-wade", title: "Dynamic Duos: Heat LeBron + Wade", type: "dynamic-duo", players: ["lebron-james-heat", "dwayne-wade-10-14"] },
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
  { id: "cousy-russell", title: "Dynamic Duos: Cousy + Russell", type: "dynamic-duo", players: ["bob-cousy", "bill-russell"] },
  { id: "ad-boogie", title: "Dynamic Duos: Anthony Davis + DeMarcus Cousins", type: "dynamic-duo", players: ["anthony-davis", "demarcus-cousins"] },
  { id: "dame-cj", title: "Dynamic Duos: Damian Lillard + CJ McCollum", type: "dynamic-duo", players: ["damian-lillard", "cj-mccollum"] },
  { id: "jokic-murray", title: "Dynamic Duos: Jokic + Murray", type: "dynamic-duo", players: ["nikola-jokic", "jamal-murray"] },
  { id: "hali-siakam", title: "Dynamic Duos: Tyrese Haliburton + Pascal Siakam", type: "dynamic-duo", players: ["tyrese-haliburton", "pascal-siakam"] },
  { id: "bird-mchale", title: "Dynamic Duos: Larry Bird + Kevin McHale", type: "dynamic-duo", players: ["larry-bird", "kevin-mchale"] },
  { id: "brunson-kat", title: "Dynamic Duos: Jalen Brunson + Karl-Anthony Towns", type: "dynamic-duo", players: ["jalen-brunson", "karl-anthony-towns"] },
  { id: "tatum-brown", title: "Dynamic Duos: Tatum + Brown", type: "dynamic-duo", players: ["jayson-tatum", "jaylen-brown"] },
  { id: "rose-noah", title: "Dynamic Duos: Derrick Rose + Joakim Noah", type: "dynamic-duo", players: ["derrick-rose", "joakim-noah"] },
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
  { id: "heat-big-three", title: "Big 3: Heat Core", type: "big-3", players: ["dwayne-wade-10-14", "chris-bosh-heat", "lebron-james-heat"] },
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

export const rolePlayerPairs: RolePlayerPairDefinition[] = [
  { id: "lamar-kobe", title: "Lakers Support Cast: Lamar Odom + Kobe Bryant (#24)", rolePlayer: "lamar-odom", centerpiece: "kobe-bryant-24" },
  { id: "artest-kobe", title: "Lakers Support Cast: Ron Artest + Kobe Bryant (#24)", rolePlayer: "ron-artest", centerpiece: "kobe-bryant-24" },
  { id: "tyson-dirk", title: "Mavericks Support Cast: Tyson Chandler + Dirk Nowitzki", rolePlayer: "tyson-chandler", centerpiece: "dirk-nowitzki" },
  { id: "jet-dirk", title: "Mavericks Support Cast: Jason Terry + Dirk Nowitzki", rolePlayer: "jason-terry", centerpiece: "dirk-nowitzki" },
  { id: "rashard-dwight", title: "Magic Support Cast: Rashard Lewis + Dwight Howard", rolePlayer: "rashard-lewis", centerpiece: "dwight-howard" },
  { id: "hedo-dwight", title: "Magic Support Cast: Hedo Turkoglu + Dwight Howard", rolePlayer: "hedo-turkoglu", centerpiece: "dwight-howard" },
  { id: "bibby-webber", title: "Kings Support Cast: Mike Bibby + Chris Webber", rolePlayer: "mike-bibby", centerpiece: "chris-webber" },
  { id: "peja-webber", title: "Kings Support Cast: Peja Stojakovic + Chris Webber", rolePlayer: "peja-stojakovic", centerpiece: "chris-webber" },
  { id: "smits-reggie", title: "Pacers Support Cast: Rik Smits + Reggie Miller", rolePlayer: "rik-smits", centerpiece: "reggie-miller" },
  { id: "marion-nash", title: "Suns Support Cast: Shawn Marion + Steve Nash", rolePlayer: "shawn-marion", centerpiece: "steve-nash" },
  { id: "gordon-jokic", title: "Nuggets Support Cast: Aaron Gordon + Nikola Jokic", rolePlayer: "aaron-gordon", centerpiece: "nikola-jokic" },
  { id: "dikembe-iverson", title: "76ers Support Cast: Dikembe Mutombo + Allen Iverson", rolePlayer: "dikembe-mutombo", centerpiece: "allen-iverson" },
  { id: "worthy-magic", title: "Lakers Support Cast: James Worthy + Magic Johnson", rolePlayer: "james-worthy", centerpiece: "magic-johnson" },
  { id: "kukoc-jordan", title: "Bulls Support Cast: Tony Kukoc + Michael Jordan", rolePlayer: "tony-kukoc", centerpiece: "michael-jordan" },
  { id: "kerr-jordan", title: "Bulls Support Cast: Steve Kerr + Michael Jordan", rolePlayer: "steve-kerr", centerpiece: "michael-jordan" },
  { id: "parish-bird", title: "Celtics Support Cast: Robert Parish + Larry Bird", rolePlayer: "robert-parish", centerpiece: "larry-bird" },
  { id: "deng-rose", title: "Bulls Support Cast: Luol Deng + Derrick Rose", rolePlayer: "luol-deng", centerpiece: "derrick-rose" },
];

export const rolePlayerBadges: PlayerBadgeDefinition[] = rolePlayerPairs.map((pair) => ({
  id: `${pair.id}-role-player`,
  title: `Role Player: ${pair.title}`,
  type: "role-player",
  players: [pair.rolePlayer, pair.centerpiece],
}));

export const centerpieceBadges: PlayerBadgeDefinition[] = rolePlayerPairs.map((pair) => ({
  id: `${pair.id}-centerpiece`,
  title: `Centerpiece: ${pair.title}`,
  type: "centerpiece",
  players: [pair.rolePlayer, pair.centerpiece],
}));

export const playerBadges: PlayerBadgeDefinition[] = [
  ...dynamicDuos,
  ...bigThrees,
  ...rivalBadges,
  ...rolePlayerBadges,
  ...centerpieceBadges,
];

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
  const badges = playerBadges.filter((badge) => {
    if (!badge.players.includes(playerId)) return false;
    if (badge.type === "role-player") return badge.players[0] === playerId;
    if (badge.type === "centerpiece") return badge.players[1] === playerId;
    return true;
  });

  const standardBadges = badges
    .filter((badge) => badge.type !== "centerpiece")
    .map((definition) => ({
      definition,
      active: definition.players.every((memberId) => owned.has(memberId)),
      previewActive: definition.players.every(
        (memberId) => owned.has(memberId) || memberId === playerId,
      ),
      tooltipPlayers: definition.players,
    }));

  const centerpieceLinks = badges.filter((badge) => badge.type === "centerpiece");
  if (centerpieceLinks.length === 0) {
    return standardBadges;
  }

  const rolePlayers = centerpieceLinks.map((badge) => badge.players[0]);
  const activeRolePlayers = rolePlayers.filter((rolePlayerId) => owned.has(rolePlayerId));

  return [
    ...standardBadges,
    {
      definition: {
        id: `centerpiece-${playerId}`,
        title: "Centerpiece",
        type: "centerpiece" as const,
        players: rolePlayers,
      },
      active: activeRolePlayers.length > 0,
      previewActive: activeRolePlayers.length > 0,
      tooltipPlayers: activeRolePlayers.length > 0 ? activeRolePlayers : rolePlayers,
    },
  ];
};

export const isDynamicDuoActiveForPlayer = (playerId: string, playerIds: string[]) =>
  getActiveDynamicDuos(playerIds).some((duo) => duo.players.includes(playerId));

export const isDynamicDuoPreviewActiveForPlayer = (playerId: string, playerIds: string[]) => {
  const duo = getPlayerDynamicDuo(playerId);
  if (!duo) return false;

  const owned = new Set(playerIds);
  return duo.players.every((memberId) => owned.has(memberId) || memberId === playerId);
};

const applyBoost = (
  players: Player[],
  activeGroups: PlayerBadgeDefinition[],
  boost: typeof rolePlayerStatBoost | typeof duoStatBoost | typeof bigThreeStatBoost,
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

export const getActiveRolePlayerPairs = (playerIds: string[]) =>
  rolePlayerPairs.filter(({ rolePlayer, centerpiece }) => {
    const owned = new Set(playerIds);
    return owned.has(rolePlayer) && owned.has(centerpiece);
  });

export const applyRolePlayerBonuses = (players: Player[]) =>
  applyBoost(
    players,
    getActiveRolePlayerPairs(players.map((player) => player.id)).map((pair) => ({
      id: pair.id,
      title: pair.title,
      type: "role-player" as const,
      players: [pair.rolePlayer, pair.centerpiece],
    })),
    rolePlayerStatBoost,
  );

export const applyDynamicDuoBonuses = (players: Player[]) =>
  applyBoost(players, getActiveDynamicDuos(players.map((player) => player.id)), duoStatBoost);

export const applyBigThreeBonuses = (players: Player[]) =>
  applyBoost(players, getActiveBigThrees(players.map((player) => player.id)), bigThreeStatBoost);

export const applySynergyBonuses = (players: Player[]) =>
  applyBigThreeBonuses(applyDynamicDuoBonuses(applyRolePlayerBonuses(players)));
