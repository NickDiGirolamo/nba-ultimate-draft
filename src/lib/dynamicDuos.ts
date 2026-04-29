import { Player } from "../types";

export type PlayerBadgeType =
  | "dynamic-duo"
  | "big-3"
  | "rival"
  | "role-player"
  | "centerpiece"
  | "team-chemistry";

export interface PlayerBadgeDefinition {
  id: string;
  title: string;
  type: PlayerBadgeType;
  players: string[];
}

export interface TeamChemistryGroupDefinition {
  id: string;
  displayName: string;
  teamName: string;
  season: string;
  nickname: string;
  eligiblePlayers: string[];
  bonusType: "team-chemistry";
  bonusValue: 1;
  iconReference: "five-player-network";
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

const teamChemistryStatBoost = {
  overall: 1,
  offense: 0,
  defense: 0,
  playmaking: 0,
  shooting: 0,
  rebounding: 0,
  athleticism: 0,
  intangibles: 0,
  ballDominance: 0,
  interiorDefense: 0,
  perimeterDefense: 0,
} as const;

interface RolePlayerPairDefinition {
  id: string;
  title: string;
  centerpiece: string;
  rolePlayer: string;
}

export const dynamicDuos: PlayerBadgeDefinition[] = [
  { id: "jerry-wilt", title: "Dynamic Duos: Jerry West + Wilt Chamberlain", type: "dynamic-duo", players: ["jerry-west", "wilt-chamberlain"] },
  { id: "jerry-elgin", title: "Dynamic Duos: Jerry West + Elgin Baylor", type: "dynamic-duo", players: ["jerry-west", "elgin-baylor"] },
  { id: "heat-shaq-wade", title: "Dynamic Duos: Heat Shaq + Wade", type: "dynamic-duo", players: ["shaquille-o-neal-heat", "dwayne-wade-03-10"] },
  { id: "kobe-shaq", title: "Dynamic Duos: Kobe + Shaq", type: "dynamic-duo", players: ["kobe-bryant-8", "shaquille-o-neal-lakers"] },
  { id: "payton-kemp", title: "Dynamic Duos: Payton + Kemp", type: "dynamic-duo", players: ["gary-payton", "shawn-kemp"] },
  { id: "nash-amare", title: "Dynamic Duos: Nash + Amar'e", type: "dynamic-duo", players: ["steve-nash", "amar-e-stoudemire-suns"] },
  { id: "heat-lebron-wade", title: "Dynamic Duos: Heat LeBron + Wade", type: "dynamic-duo", players: ["lebron-james-heat", "dwayne-wade-10-14"] },
  { id: "cp3-west", title: "Dynamic Duos: Chris Paul + David West", type: "dynamic-duo", players: ["chris-paul-hornets", "david-west"] },
  { id: "cp3-blake", title: "Dynamic Duos: Chris Paul + Blake Griffin", type: "dynamic-duo", players: ["chris-paul-clippers", "blake-griffin"] },
  { id: "al-david-knicks", title: "Dynamic Duos: Al Harrington (Knicks) + David Lee", type: "dynamic-duo", players: ["al-harrington-knicks", "david-lee"] },
  { id: "bosh-bargnani", title: "Dynamic Duos: Chris Bosh (Raptors) + Andrea Bargnani", type: "dynamic-duo", players: ["chris-bosh-raptors", "andrea-bargnani"] },
  { id: "crash-emeka", title: "Dynamic Duos: Gerald Wallace + Emeka Okafor", type: "dynamic-duo", players: ["gerald-wallace", "emeka-okafor"] },
  { id: "clyde-earl", title: "Dynamic Duos: Walt Frazier + Earl Monroe", type: "dynamic-duo", players: ["walt-frazier", "earl-monroe"] },
  { id: "clyde-willis", title: "Dynamic Duos: Walt Frazier + Willis Reed", type: "dynamic-duo", players: ["walt-frazier", "willis-reed"] },
  { id: "english-issel", title: "Dynamic Duos: Alex English + Dan Issel", type: "dynamic-duo", players: ["alex-english", "dan-issel"] },
  { id: "havlicek-cowens", title: "Dynamic Duos: John Havlicek + Dave Cowens", type: "dynamic-duo", players: ["john-havlicek", "dave-cowens"] },
  { id: "thompson-issel", title: "Dynamic Duos: David Thompson + Dan Issel", type: "dynamic-duo", players: ["david-thompson", "dan-issel"] },
  { id: "lj-zo-hornets", title: "Dynamic Duos: Larry Johnson + Alonzo Mourning (Hornets)", type: "dynamic-duo", players: ["larry-johnson", "alonzo-mourning-hornets"] },
  { id: "deron-boozer", title: "Dynamic Duos: Deron + Boozer", type: "dynamic-duo", players: ["deron-williams", "carlos-boozer"] },
  { id: "kd-russ", title: "Dynamic Duos: KD + Russ", type: "dynamic-duo", players: ["kevin-durant-thunder", "russell-westbrook"] },
  { id: "wall-beal", title: "Dynamic Duos: Wall + Beal", type: "dynamic-duo", players: ["john-wall", "bradley-beal"] },
  { id: "stockton-malone", title: "Dynamic Duos: Stockton + Malone", type: "dynamic-duo", players: ["john-stockton", "karl-malone"] },
  { id: "starbury-kg", title: "Dynamic Duos: Stephon Marbury + Kevin Garnett", type: "dynamic-duo", players: ["stephon-marbury", "kevin-garnett-timberwolves"] },
  { id: "allan-sprewell", title: "Dynamic Duos: Allan Houston + Latrell Sprewell", type: "dynamic-duo", players: ["allan-houston", "latrell-sprewell"] },
  { id: "grit-grind", title: "Dynamic Duos: Randolph + Gasol", type: "dynamic-duo", players: ["zach-randolph", "marc-gasol"] },
  { id: "big-dog-baker", title: "Dynamic Duos: Glenn Robinson + Vin Baker", type: "dynamic-duo", players: ["glenn-robinson", "vin-baker"] },
  { id: "big-country-shareef", title: "Dynamic Duos: Bryant Reeves + Shareef Abdour-Rahim", type: "dynamic-duo", players: ["bryant-reeves", "shareef-abdour-rahim"] },
  { id: "lebron-kyrie", title: "Dynamic Duos: LeBron + Kyrie", type: "dynamic-duo", players: ["lebron-james-14-18", "kyrie-irving-cavs"] },
  { id: "jordan-pippen", title: "Dynamic Duos: Jordan + Pippen", type: "dynamic-duo", players: ["michael-jordan", "scottie-pippen"] },
  { id: "magic-kareem", title: "Dynamic Duos: Magic + Kareem", type: "dynamic-duo", players: ["magic-johnson", "kareem-abdul-jabbar-lakers"] },
  { id: "cousy-russell", title: "Dynamic Duos: Cousy + Russell", type: "dynamic-duo", players: ["bob-cousy", "bill-russell"] },
  { id: "ad-boogie", title: "Dynamic Duos: Anthony Davis + DeMarcus Cousins", type: "dynamic-duo", players: ["anthony-davis-pelicans", "demarcus-cousins"] },
  { id: "brand-maggette", title: "Dynamic Duos: Elton Brand + Corey Maggette", type: "dynamic-duo", players: ["elton-brand", "corey-maggette"] },
  { id: "steve-cutino", title: "Dynamic Duos: Steve Francis + Cutino Mobley", type: "dynamic-duo", players: ["steve-francis", "cutino-mobley"] },
  { id: "kawhi-siakam-raptors", title: "Dynamic Duos: Kawhi Leonard + Pascal Siakam", type: "dynamic-duo", players: ["kawhi-leonard-raptors", "pascal-siakam-raptors"] },
  { id: "bird-mchale", title: "Dynamic Duos: Larry Bird + Kevin McHale", type: "dynamic-duo", players: ["larry-bird", "kevin-mchale"] },
  { id: "isiah-dumars", title: "Dynamic Duos: Isiah Thomas + Joe Dumars", type: "dynamic-duo", players: ["isiah-thomas", "joe-dumars"] },
  { id: "erving-moses", title: "Dynamic Duos: Julius Erving + Moses Malone", type: "dynamic-duo", players: ["julius-erving", "moses-malone"] },
  { id: "webber-divac", title: "Dynamic Duos: Chris Webber + Vlade Divac", type: "dynamic-duo", players: ["chris-webber", "vlade-divac"] },
  { id: "rose-noah", title: "Dynamic Duos: Derrick Rose + Joakim Noah", type: "dynamic-duo", players: ["derrick-rose", "joakim-noah"] },
  { id: "mitchell-gobert", title: "Dynamic Duos: Donovan Mitchell + Rudy Gobert", type: "dynamic-duo", players: ["donovan-mitchell", "rudy-gobert"] },
  { id: "steph-klay", title: "Dynamic Duos: Steph + Klay", type: "dynamic-duo", players: ["steph-curry", "klay-thompson"] },
  { id: "dame-cj-blazers", title: "Dynamic Duos: Dame + CJ", type: "dynamic-duo", players: ["damian-lillard", "cj-mccollum-blazers"] },
  { id: "al-love-wolves", title: "Dynamic Duos: Al Jefferson + Kevin Love", type: "dynamic-duo", players: ["al-jefferson", "kevin-love-timberwolves"] },
  { id: "tmac-vince", title: "Dynamic Duos: T-Mac + Vince", type: "dynamic-duo", players: ["tracy-mcgrady-raptors", "vince-carter-raptors"] },
  { id: "tmac-yao", title: "Dynamic Duos: T-Mac + Yao", type: "dynamic-duo", players: ["tracy-mcgrady-rockets", "yao-ming"] },
  { id: "duncan-robinson", title: "Dynamic Duos: Duncan + Robinson", type: "dynamic-duo", players: ["tim-duncan", "david-robinson"] },
  { id: "bucks-kareem-oscar", title: "Dynamic Duos: Kareem + Oscar", type: "dynamic-duo", players: ["kareem-abdul-jabbar-bucks", "oscar-robertson"] },
  { id: "penny-shaq", title: "Dynamic Duos: Penny + Shaq", type: "dynamic-duo", players: ["penny-hardaway", "shaquille-o-neal-magic"] },
  { id: "clyde-hakeem", title: "Dynamic Duos: Clyde Drexler (Rockets) + Hakeem Olajuwon", type: "dynamic-duo", players: ["clyde-drexler-rockets", "hakeem-olajuwon"] },
  { id: "kobe-pau", title: "Dynamic Duos: Kobe + Pau", type: "dynamic-duo", players: ["kobe-bryant-24", "pau-gasol"] },
  { id: "iverson-dikembe", title: "Dynamic Duos: Allen Iverson + Dikembe Mutombo", type: "dynamic-duo", players: ["allen-iverson-76ers", "dikembe-mutombo"] },
  { id: "iverson-melo-nuggets", title: "Dynamic Duos: Allen Iverson + Carmelo Anthony", type: "dynamic-duo", players: ["allen-iverson-nuggets", "carmelo-anthony-nuggets"] },
  { id: "amare-melo-knicks", title: "Dynamic Duos: Amar'e Stoudemire + Carmelo Anthony", type: "dynamic-duo", players: ["amar-e-stoudemire-knicks", "carmelo-anthony-knicks"] },
  { id: "mahmoud-dikembe-nuggets", title: "Dynamic Duos: Mahmoud Abdul-Rauf + Dikembe Mutombo (Nuggets)", type: "dynamic-duo", players: ["mahmoud-abdul-rauf", "dikembe-mutombo-nuggets"] },
];

export const bigThrees: PlayerBadgeDefinition[] = [
  { id: "spurs-big-three", title: "Big 3: Spurs Core", type: "big-3", players: ["tim-duncan", "tony-parker", "manu-ginobili"] },
  { id: "celtics-big-three", title: "Big 3: Celtics Core", type: "big-3", players: ["ray-allen-celtics", "paul-pierce", "kevin-garnett-celtics"] },
  { id: "heat-big-three", title: "Big 3: Heat Core", type: "big-3", players: ["dwayne-wade-10-14", "chris-bosh-heat", "lebron-james-heat"] },
  { id: "cavs-big-three", title: "Big 3: Cavaliers Core", type: "big-3", players: ["lebron-james-14-18", "kyrie-irving-cavs", "kevin-love-cavs"] },
  { id: "bulls-big-three", title: "Big 3: Bulls Core", type: "big-3", players: ["michael-jordan", "scottie-pippen", "dennis-rodman-bulls"] },
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
  { id: "ariza-kobe", title: "Lakers Support Cast: Trevor Ariza + Kobe Bryant (#24)", rolePlayer: "trevor-ariza", centerpiece: "kobe-bryant-24" },
  { id: "bynum-kobe", title: "Lakers Support Cast: Andrew Bynum + Kobe Bryant (#24)", rolePlayer: "andrew-bynum", centerpiece: "kobe-bryant-24" },
  { id: "fisher-kobe-8", title: "Lakers Support Cast: Derek Fisher + Kobe Bryant (#8)", rolePlayer: "derek-fisher", centerpiece: "kobe-bryant-8" },
  { id: "horry-kobe-8", title: "Lakers Support Cast: Robert Horry + Kobe Bryant (#8)", rolePlayer: "robert-horry", centerpiece: "kobe-bryant-8" },
  { id: "tyson-dirk", title: "Mavericks Support Cast: Tyson Chandler + Dirk Nowitzki", rolePlayer: "tyson-chandler", centerpiece: "dirk-nowitzki" },
  { id: "jet-dirk", title: "Mavericks Support Cast: Jason Terry + Dirk Nowitzki", rolePlayer: "jason-terry", centerpiece: "dirk-nowitzki" },
  { id: "finley-dirk", title: "Mavericks Support Cast: Michael Finley + Dirk Nowitzki", rolePlayer: "michael-finley", centerpiece: "dirk-nowitzki" },
  { id: "josh-dirk", title: "Mavericks Support Cast: Josh Howard + Dirk Nowitzki", rolePlayer: "josh-howard", centerpiece: "dirk-nowitzki" },
  { id: "stackhouse-dirk", title: "Mavericks Support Cast: Jerry Stackhouse + Dirk Nowitzki", rolePlayer: "jerry-stackhouse", centerpiece: "dirk-nowitzki" },
  { id: "rashard-dwight", title: "Magic Support Cast: Rashard Lewis + Dwight Howard", rolePlayer: "rashard-lewis", centerpiece: "dwight-howard" },
  { id: "hedo-dwight", title: "Magic Support Cast: Hedo Turkoglu + Dwight Howard", rolePlayer: "hedo-turkoglu", centerpiece: "dwight-howard" },
  { id: "jameer-dwight", title: "Magic Support Cast: Jameer Nelson + Dwight Howard", rolePlayer: "jameer-nelson", centerpiece: "dwight-howard" },
  { id: "rafer-dwight", title: "Magic Support Cast: Rafer Alston + Dwight Howard", rolePlayer: "rafer-alston", centerpiece: "dwight-howard" },
  { id: "redick-dwight", title: "Magic Support Cast: J.J. Redick + Dwight Howard", rolePlayer: "j-j-redick", centerpiece: "dwight-howard" },
  { id: "dennis-shaq-magic", title: "Magic Support Cast: Dennis Scott + Shaquille O'Neal (Magic)", rolePlayer: "dennis-scott", centerpiece: "shaquille-o-neal-magic" },
  { id: "bibby-webber", title: "Kings Support Cast: Mike Bibby + Chris Webber", rolePlayer: "mike-bibby", centerpiece: "chris-webber" },
  { id: "peja-webber", title: "Kings Support Cast: Peja Stojakovic + Chris Webber", rolePlayer: "peja-stojakovic", centerpiece: "chris-webber" },
  { id: "doug-webber", title: "Kings Support Cast: Doug Christie + Chris Webber", rolePlayer: "doug-christie", centerpiece: "chris-webber" },
  { id: "smits-reggie", title: "Pacers Support Cast: Rik Smits + Reggie Miller", rolePlayer: "rik-smits", centerpiece: "reggie-miller" },
  { id: "mark-reggie", title: "Pacers Support Cast: Mark Jackson + Reggie Miller", rolePlayer: "mark-jackson", centerpiece: "reggie-miller" },
  { id: "marion-nash", title: "Suns Support Cast: Shawn Marion + Steve Nash", rolePlayer: "shawn-marion", centerpiece: "steve-nash" },
  { id: "diaw-nash", title: "Suns Support Cast: Boris Diaw + Steve Nash", rolePlayer: "boris-diaw", centerpiece: "steve-nash" },
  { id: "majerle-barkley-suns", title: "Suns Support Cast: Dan Majerle + Charles Barkley (Suns)", rolePlayer: "dan-majerle", centerpiece: "charles-barkley-suns" },
  { id: "kj-barkley-suns", title: "Suns Support Cast: Kevin Johnson + Charles Barkley (Suns)", rolePlayer: "kevin-johnson", centerpiece: "charles-barkley-suns" },
  { id: "chambers-barkley-suns", title: "Suns Support Cast: Tom Chambers + Charles Barkley (Suns)", rolePlayer: "tom-chambers", centerpiece: "charles-barkley-suns" },
  { id: "bogut-steph", title: "Warriors Support Cast: Andrew Bogut + Steph Curry", rolePlayer: "andrew-bogut", centerpiece: "steph-curry" },
  { id: "worthy-magic", title: "Lakers Support Cast: James Worthy + Magic Johnson", rolePlayer: "james-worthy", centerpiece: "magic-johnson" },
  { id: "coop-magic", title: "Lakers Support Cast: Michael Cooper + Magic Johnson", rolePlayer: "michael-cooper", centerpiece: "magic-johnson" },
  { id: "byron-magic", title: "Lakers Support Cast: Byron Scott + Magic Johnson", rolePlayer: "byron-scott", centerpiece: "magic-johnson" },
  { id: "starks-ewing", title: "Knicks Support Cast: John Starks + Patrick Ewing", rolePlayer: "john-starks", centerpiece: "patrick-ewing" },
  { id: "kukoc-jordan", title: "Bulls Support Cast: Tony Kukoc + Michael Jordan", rolePlayer: "tony-kukoc", centerpiece: "michael-jordan" },
  { id: "kerr-jordan", title: "Bulls Support Cast: Steve Kerr + Michael Jordan", rolePlayer: "steve-kerr", centerpiece: "michael-jordan" },
  { id: "horace-jordan", title: "Bulls Support Cast: Horace Grant + Michael Jordan", rolePlayer: "horace-grant", centerpiece: "michael-jordan" },
  { id: "udonis-wade-young-heat", title: "Heat Support Cast: Udonis Haslem + Dwayne Wade ('03 - '10)", rolePlayer: "udonis-haslem", centerpiece: "dwayne-wade-03-10" },
  { id: "parish-bird", title: "Celtics Support Cast: Robert Parish + Larry Bird", rolePlayer: "robert-parish", centerpiece: "larry-bird" },
  { id: "dj-bird", title: "Celtics Support Cast: Dennis Johnson + Larry Bird", rolePlayer: "dennis-johnson", centerpiece: "larry-bird" },
  { id: "sam-russell", title: "Celtics Support Cast: Sam Jones + Bill Russell", rolePlayer: "sam-jones", centerpiece: "bill-russell" },
  { id: "hibbert-pg", title: "Pacers Support Cast: Roy Hibbert + Paul George", rolePlayer: "roy-hibbert", centerpiece: "paul-george" },
  { id: "lance-pg", title: "Pacers Support Cast: Lance Stephenson + Paul George", rolePlayer: "lance-stephenson", centerpiece: "paul-george" },
  { id: "doc-nique", title: "Hawks Support Cast: Doc Rivers + Dominique Wilkins", rolePlayer: "doc-rivers", centerpiece: "dominique-wilkins" },
  { id: "willis-nique", title: "Hawks Support Cast: Kevin Willis + Dominique Wilkins", rolePlayer: "kevin-willis", centerpiece: "dominique-wilkins" },
  { id: "deng-rose", title: "Bulls Support Cast: Luol Deng + Derrick Rose", rolePlayer: "luol-deng", centerpiece: "derrick-rose" },
  { id: "mario-lebron-heat", title: "Heat Support Cast: Mario Chalmers + LeBron James (Heat)", rolePlayer: "mario-chalmers", centerpiece: "lebron-james-heat" },
  { id: "birdman-lebron-heat", title: "Heat Support Cast: Chris Andersen + LeBron James (Heat)", rolePlayer: "chris-andersen", centerpiece: "lebron-james-heat" },
  { id: "varejao-lebron-young-cavs", title: "Cavs Support Cast: Anderson Varejao + LeBron James ('03 - '10)", rolePlayer: "anderson-varejao", centerpiece: "lebron-james-03-10" },
  { id: "mo-lebron-young-cavs", title: "Cavs Support Cast: Mo Williams + LeBron James ('03 - '10)", rolePlayer: "mo-williams", centerpiece: "lebron-james-03-10" },
  { id: "gibson-lebron-young-cavs", title: "Cavs Support Cast: Daniel Gibson + LeBron James ('03 - '10)", rolePlayer: "daniel-gibson", centerpiece: "lebron-james-03-10" },
  { id: "hughes-lebron-young-cavs", title: "Cavs Support Cast: Larry Hughes + LeBron James ('03 - '10)", rolePlayer: "larry-hughes", centerpiece: "lebron-james-03-10" },
  { id: "capela-harden", title: "Rockets Support Cast: Clint Capela + James Harden (Rockets)", rolePlayer: "clint-capela", centerpiece: "james-harden-rockets" },
  { id: "pj-harden", title: "Rockets Support Cast: P.J. Tucker + James Harden (Rockets)", rolePlayer: "p-j-tucker", centerpiece: "james-harden-rockets" },
  { id: "gordon-harden", title: "Rockets Support Cast: Eric Gordon + James Harden (Rockets)", rolePlayer: "eric-gordon", centerpiece: "james-harden-rockets" },
  { id: "jr-lebron", title: "Cavs Support Cast: J.R. Smith + LeBron James ('10 - '14)", rolePlayer: "j-r-smith", centerpiece: "lebron-james-14-18" },
  { id: "ak47-deron", title: "Jazz Support Cast: Andrei Kirilenko + Deron Williams", rolePlayer: "andrei-kirilenko", centerpiece: "deron-williams" },
  { id: "eaton-malone", title: "Jazz Support Cast: Mark Eaton + Karl Malone", rolePlayer: "mark-eaton", centerpiece: "karl-malone" },
  { id: "wally-kg", title: "Timberwolves Support Cast: Wally Szczerbiak + Kevin Garnett (Timberwolves)", rolePlayer: "wally-szczerbiak", centerpiece: "kevin-garnett-timberwolves" },
  { id: "cassell-kg", title: "Timberwolves Support Cast: Sam Cassell + Kevin Garnett (Timberwolves)", rolePlayer: "sam-cassell", centerpiece: "kevin-garnett-timberwolves" },
  { id: "thorpe-hakeem", title: "Rockets Support Cast: Otis Thorpe + Hakeem Olajuwon", rolePlayer: "otis-thorpe", centerpiece: "hakeem-olajuwon" },
  { id: "kenny-hakeem", title: "Rockets Support Cast: Kenny Smith + Hakeem Olajuwon", rolePlayer: "kenny-smith", centerpiece: "hakeem-olajuwon" },
  { id: "ralph-hakeem", title: "Rockets Support Cast: Ralph Sampson + Hakeem Olajuwon", rolePlayer: "ralph-sampson", centerpiece: "hakeem-olajuwon" },
  { id: "nene-wall", title: "Wizards Support Cast: Nene + John Wall", rolePlayer: "nene", centerpiece: "john-wall" },
  { id: "ibaka-kd-thunder", title: "Thunder Support Cast: Serge Ibaka + Kevin Durant (Thunder)", rolePlayer: "serge-ibaka", centerpiece: "kevin-durant-thunder" },
  { id: "kawhi-duncan", title: "Spurs Support Cast: Kawhi Leonard (Spurs) + Tim Duncan", rolePlayer: "kawhi-leonard-spurs", centerpiece: "tim-duncan" },
  { id: "danny-duncan", title: "Spurs Support Cast: Danny Green + Tim Duncan", rolePlayer: "danny-green", centerpiece: "tim-duncan" },
  { id: "dawkins-erving", title: "76ers Support Cast: Darryl Dawkins + Julius Erving", rolePlayer: "darryl-dawkins", centerpiece: "julius-erving" },
  { id: "iguodala-iverson", title: "76ers Support Cast: Andre Iguodala + Allen Iverson (76ers)", rolePlayer: "andre-iguodala", centerpiece: "allen-iverson-76ers" },
  { id: "kenyon-kidd", title: "Nets Support Cast: Kenyon Martin + Jason Kidd", rolePlayer: "kenyon-martin", centerpiece: "jason-kidd" },
  { id: "kittles-kidd", title: "Nets Support Cast: Kerry Kittles + Jason Kidd", rolePlayer: "kerry-kittles", centerpiece: "jason-kidd" },
  { id: "kvh-kidd", title: "Nets Support Cast: Keith Van Horn + Jason Kidd", rolePlayer: "keith-van-horn", centerpiece: "jason-kidd" },
  { id: "rj-kidd", title: "Nets Support Cast: Richard Jefferson + Jason Kidd", rolePlayer: "richard-jefferson", centerpiece: "jason-kidd" },
  { id: "muggsy-glen", title: "Hornets Support Cast: Muggsy Bogues + Glen Rice", rolePlayer: "muggsy-bogues", centerpiece: "glen-rice" },
  { id: "dell-glen", title: "Hornets Support Cast: Dell Curry + Glen Rice", rolePlayer: "dell-curry", centerpiece: "glen-rice" },
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

export const teamChemistryGroups: TeamChemistryGroupDefinition[] = [
  {
    id: "we-believe-warriors",
    displayName: "Team Chemistry: We Believe",
    teamName: "Golden State Warriors",
    season: "2007",
    nickname: "We Believe",
    eligiblePlayers: [
      "baron-davis",
      "stephen-jackson",
      "jason-richardson",
      "monta-ellis",
      "andris-biedri-s",
    ],
    bonusType: "team-chemistry",
    bonusValue: 1,
    iconReference: "five-player-network",
  },
  {
    id: "grit-and-grind-grizzlies",
    displayName: "Team Chemistry: Grit and Grind",
    teamName: "Memphis Grizzlies",
    season: "2011",
    nickname: "Grit and Grind",
    eligiblePlayers: [
      "mike-conley",
      "tony-allen",
      "rudy-gay",
      "zach-randolph",
      "marc-gasol",
      "o-j-mayo",
    ],
    bonusType: "team-chemistry",
    bonusValue: 1,
    iconReference: "five-player-network",
  },
  {
    id: "sixty-win-hawks",
    displayName: "Team Chemistry: 60-Win Hawks",
    teamName: "Atlanta Hawks",
    season: "2015",
    nickname: "60-Win Hawks",
    eligiblePlayers: [
      "joe-johnson",
      "jeff-teague",
      "kyle-korver",
      "demarre-carroll",
      "paul-millsap",
      "al-horford-hawks",
    ],
    bonusType: "team-chemistry",
    bonusValue: 1,
    iconReference: "five-player-network",
  },
  {
    id: "going-to-work-pistons",
    displayName: "Team Chemistry: Going to Work",
    teamName: "Detroit Pistons",
    season: "2004",
    nickname: "Going to Work",
    eligiblePlayers: [
      "chauncey-billups",
      "rip-hamilton",
      "tayshaun-prince",
      "rasheed-wallace",
      "ben-wallace",
    ],
    bonusType: "team-chemistry",
    bonusValue: 1,
    iconReference: "five-player-network",
  },
  {
    id: "championship-celtics-2008",
    displayName: "Team Chemistry: 2008 Celtics",
    teamName: "Boston Celtics",
    season: "2008",
    nickname: "2008 Celtics",
    eligiblePlayers: [
      "rajon-rondo",
      "kevin-garnett-celtics",
      "ray-allen-celtics",
      "kendrick-perkins",
      "glen-davis",
      "paul-pierce",
    ],
    bonusType: "team-chemistry",
    bonusValue: 1,
    iconReference: "five-player-network",
  },
  {
    id: "lob-city-clippers",
    displayName: "Team Chemistry: Lob City Clippers",
    teamName: "Los Angeles Clippers",
    season: "2010s",
    nickname: "Lob City",
    eligiblePlayers: [
      "deandre-jordan",
      "chris-paul-clippers",
      "blake-griffin",
      "lou-williams",
      "jamal-crawford",
    ],
    bonusType: "team-chemistry",
    bonusValue: 1,
    iconReference: "five-player-network",
  },
  {
    id: "bad-boy-pistons",
    displayName: "Team Chemistry: Bad Boy Pistons",
    teamName: "Detroit Pistons",
    season: "Late 1980s",
    nickname: "Bad Boy Pistons",
    eligiblePlayers: [
      "isiah-thomas",
      "dennis-rodman-pistons",
      "bill-laimbeer",
      "joe-dumars",
    ],
    bonusType: "team-chemistry",
    bonusValue: 1,
    iconReference: "five-player-network",
  },
];

export const teamChemistryBadges: PlayerBadgeDefinition[] = teamChemistryGroups.map((group) => ({
  id: group.id,
  title: group.displayName,
  type: "team-chemistry",
  players: group.eligiblePlayers,
}));

export const playerBadges: PlayerBadgeDefinition[] = [
  ...dynamicDuos,
  ...bigThrees,
  ...rivalBadges,
  ...teamChemistryBadges,
  ...rolePlayerBadges,
  ...centerpieceBadges,
];

const teamChemistryGroupById = new Map(teamChemistryGroups.map((group) => [group.id, group]));

export const getTeamChemistryGroupById = (id: string) => teamChemistryGroupById.get(id);

const getActiveBadges = (badges: PlayerBadgeDefinition[], playerIds: string[]) => {
  const owned = new Set(playerIds);
  return badges.filter((badge) => badge.players.every((playerId) => owned.has(playerId)));
};

const getOwnedTeamChemistryPlayers = (
  group: TeamChemistryGroupDefinition,
  owned: Set<string>,
) => group.eligiblePlayers.filter((playerId) => owned.has(playerId));

const isTeamChemistryBadgeActive = (
  group: TeamChemistryGroupDefinition | undefined,
  owned: Set<string>,
) => (group ? getOwnedTeamChemistryPlayers(group, owned).length >= 2 : false);

export const getPlayerDynamicDuos = (playerId: string) =>
  dynamicDuos.filter((duo) => duo.players.includes(playerId));

export const getPlayerDynamicDuo = (playerId: string) =>
  getPlayerDynamicDuos(playerId)[0];

export const getActiveDynamicDuos = (playerIds: string[]) => getActiveBadges(dynamicDuos, playerIds);

export const getActiveBigThrees = (playerIds: string[]) => getActiveBadges(bigThrees, playerIds);

export const getActiveRivalBadges = (playerIds: string[]) => getActiveBadges(rivalBadges, playerIds);

export const getActiveTeamChemistryGroups = (playerIds: string[]) => {
  const owned = new Set(playerIds);
  return teamChemistryGroups.filter((group) => isTeamChemistryBadgeActive(group, owned));
};

export const getPlayerBadgeStates = (playerId: string, playerIds: string[]) => {
  const owned = new Set(playerIds);
  const badges = playerBadges.filter((badge) => {
    if (!badge.players.includes(playerId)) return false;
    if (badge.type === "role-player") return badge.players[0] === playerId;
    if (badge.type === "centerpiece") return badge.players[1] === playerId;
    return true;
  });

  const standardBadges = badges
    .filter((badge) => badge.type !== "centerpiece" && badge.type !== "dynamic-duo")
    .map((definition) => {
      if (definition.type === "team-chemistry") {
        const group = getTeamChemistryGroupById(definition.id);
        const previewOwned = new Set([...owned, playerId]);
        const ownedPlayers = group ? getOwnedTeamChemistryPlayers(group, owned) : [];

        return {
          definition,
          active: isTeamChemistryBadgeActive(group, owned),
          previewActive: isTeamChemistryBadgeActive(group, previewOwned),
          tooltipPlayers: ownedPlayers.length >= 2 ? ownedPlayers : definition.players,
        };
      }

      return {
        definition,
        active: definition.players.every((memberId) => owned.has(memberId)),
        previewActive: definition.players.every(
          (memberId) => owned.has(memberId) || memberId === playerId,
        ),
        tooltipPlayers: definition.players,
      };
    });

  const dynamicDuoLinks = badges.filter((badge) => badge.type === "dynamic-duo");
  const dynamicDuoBadges =
    dynamicDuoLinks.length === 0
      ? []
      : dynamicDuoLinks.length === 1
        ? dynamicDuoLinks.map((definition) => ({
            definition,
            active: definition.players.every((memberId) => owned.has(memberId)),
            previewActive: definition.players.every(
              (memberId) => owned.has(memberId) || memberId === playerId,
            ),
            tooltipPlayers: definition.players.filter((memberId) => memberId !== playerId),
          }))
        : (() => {
            const partnerIds = [...new Set(
              dynamicDuoLinks.flatMap((badge) =>
                badge.players.filter((memberId) => memberId !== playerId),
              ),
            )];
            const activePartners = [...new Set(
              dynamicDuoLinks
                .filter((badge) => badge.players.every((memberId) => owned.has(memberId)))
                .flatMap((badge) => badge.players.filter((memberId) => memberId !== playerId)),
            )];

            return [{
              definition: {
                id: `dynamic-duo-${playerId}`,
                title: "Dynamic Duo",
                type: "dynamic-duo" as const,
                players: partnerIds,
              },
              active: activePartners.length > 0,
              previewActive: dynamicDuoLinks.some((badge) =>
                badge.players.every((memberId) => owned.has(memberId) || memberId === playerId),
              ),
              tooltipPlayers: activePartners.length > 0 ? activePartners : partnerIds,
            }];
          })();

  const centerpieceLinks = badges.filter((badge) => badge.type === "centerpiece");
  if (centerpieceLinks.length === 0) {
    return [...dynamicDuoBadges, ...standardBadges];
  }

  const rolePlayers = centerpieceLinks.map((badge) => badge.players[0]);
  const activeRolePlayers = rolePlayers.filter((rolePlayerId) => owned.has(rolePlayerId));

  return [
    ...dynamicDuoBadges,
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
  const duos = getPlayerDynamicDuos(playerId);
  if (duos.length === 0) return false;

  const owned = new Set(playerIds);
  return duos.some((duo) =>
    duo.players.every((memberId) => owned.has(memberId) || memberId === playerId),
  );
};

const applyBoost = (
  players: Player[],
  activeGroups: PlayerBadgeDefinition[],
  boost:
    | typeof rolePlayerStatBoost
    | typeof duoStatBoost
    | typeof bigThreeStatBoost
    | typeof teamChemistryStatBoost,
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

export const applyTeamChemistryBonuses = (players: Player[]) =>
  applyBoost(
    players,
    getActiveTeamChemistryGroups(players.map((player) => player.id)).map((group) => ({
      id: group.id,
      title: group.displayName,
      type: "team-chemistry" as const,
      players: group.eligiblePlayers,
    })),
    teamChemistryStatBoost,
  );

export const applySynergyBonuses = (players: Player[]) =>
  applyBigThreeBonuses(
    applyDynamicDuoBonuses(
      applyRolePlayerBonuses(applyTeamChemistryBonuses(players)),
    ),
  );
