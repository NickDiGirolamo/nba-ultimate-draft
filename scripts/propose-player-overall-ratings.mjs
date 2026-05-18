import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "docs", "player-rating-review");

const SOURCE_FILES = [
  path.join(ROOT, "src", "data", "players.ts"),
  path.join(ROOT, "src", "data", "players-current-2026.ts"),
];

const TIER_RANGES = [
  { tier: "Galaxy", min: 96 },
  { tier: "Amethyst", min: 91 },
  { tier: "Ruby", min: 86 },
  { tier: "Sapphire", min: 80 },
  { tier: "Emerald", min: 75 },
];

const WEIGHTS = {
  peakAbility: 0.35,
  careerAchievement: 0.25,
  longevity: 0.15,
  playoffPerformance: 0.1,
  awardsHonors: 0.1,
  historicalImpact: 0.05,
};

const EXACT_CARD_ANCHORS = {
  "Michael Jordan": {
    overall: 100,
    components: [100, 100, 98, 100, 100, 100],
    reason: "Global anchor: Michael Jordan is the only 100 by rule.",
  },
  "LeBron James ('14 - '18)": {
    overall: 99,
    components: [100, 100, 99, 99, 100, 99],
    reason: "Peak all-around LeBron anchor at 99, below only Jordan.",
  },
  "LeBron James (Heat)": {
    overall: 98,
    components: [100, 98, 91, 99, 98, 98],
    reason: "Heat LeBron is an apex two-way version, separated just below the complete 2014-18 anchor.",
  },
  "LeBron James ('03 - '10)": {
    overall: 96,
    components: [98, 92, 82, 90, 92, 97],
    reason: "First Cleveland LeBron has overwhelming peak athletic force, with career/playoff resume still below later versions.",
  },
  "Kareem Abdul-Jabbar (Bucks)": {
    overall: 98,
    components: [99, 99, 100, 96, 100, 99],
    reason: "Prime Kareem anchor: inner-circle peak plus unmatched longevity and honors.",
  },
  "Kareem Abdul-Jabbar (Lakers)": {
    overall: 97,
    components: [96, 100, 100, 96, 100, 98],
    reason: "Lakers Kareem keeps all-time career value but is slightly below the younger peak card.",
  },
  "Shaquille O'Neal (Lakers)": {
    overall: 98,
    components: [100, 96, 88, 99, 97, 96],
    reason: "Apex Shaq anchor: one of the most dominant peaks ever with elite playoff translation.",
  },
  "Shaquille O'Neal (Magic)": {
    overall: 96,
    components: [97, 87, 78, 88, 86, 89],
    reason: "Magic Shaq is an elite young peak, but below the Lakers title-prime version.",
  },
  "Shaquille O'Neal (Heat)": {
    overall: 90,
    components: [89, 93, 82, 89, 93, 90],
    reason: "Heat Shaq is an older championship co-star version, not the all-time apex card.",
  },
  "Tim Duncan": {
    overall: 98,
    components: [97, 99, 99, 98, 99, 96],
    reason: "Duncan anchor: elite peak, longevity, playoff value, and two-way title equity.",
  },
  "Kobe Bryant (#24)": {
    overall: 98,
    components: [98, 99, 96, 98, 99, 98],
    reason: "Prime Kobe anchor: complete alpha shot creation with elite honors and playoff value.",
  },
  "Kobe Bryant (#8)": {
    overall: 97,
    components: [98, 95, 90, 95, 95, 96],
    reason: "Young Kobe is more explosive and defensive, but below the complete #24 card.",
  },
  "Steph Curry": {
    overall: 98,
    components: [99, 98, 94, 97, 98, 100],
    reason: "Curry anchor: era-changing offensive peak, titles, honors, and historic shooting impact.",
  },
  "Wilt Chamberlain": {
    overall: 98,
    components: [100, 98, 98, 92, 98, 98],
    reason: "Warriors Wilt anchor: historic statistical dominance and era-relative peak.",
  },
  "Wilt Chamberlain (Lakers)": {
    overall: 96,
    components: [93, 98, 98, 96, 98, 97],
    reason: "Lakers Wilt is an older, defense-and-role-shifted version below the Warriors peak.",
  },
  "Bill Russell": {
    overall: 98,
    components: [97, 100, 97, 100, 99, 100],
    reason: "Russell anchor: unmatched defensive, title, playoff, and era impact profile.",
  },
  "Magic Johnson": {
    overall: 98,
    components: [98, 99, 94, 99, 99, 99],
    reason: "Magic anchor: inner-circle offensive engine, playoff greatness, titles, and impact.",
  },
  "Larry Bird": {
    overall: 98,
    components: [99, 98, 87, 97, 98, 98],
    reason: "Bird anchor: all-time peak, awards, portability, shotmaking, and rivalry-era impact.",
  },
  "Hakeem Olajuwon": {
    overall: 97,
    components: [98, 96, 92, 98, 96, 95],
    reason: "Hakeem anchor: elite two-way peak and playoff carry, slightly below the 98 inner circle.",
  },
  "Oscar Robertson": {
    overall: 97,
    components: [98, 98, 94, 92, 98, 96],
    reason: "Oscar anchor: era-dominant jumbo guard production and all-time career achievement.",
  },
  "Kevin Durant (Warriors)": {
    overall: 97,
    components: [98, 96, 91, 97, 96, 94],
    reason: "Warriors Durant anchor: best complete version with elite scoring and Finals value.",
  },
  "Kevin Durant (Thunder)": {
    overall: 96,
    components: [97, 94, 86, 91, 94, 92],
    reason: "Thunder Durant has the explosive scoring peak but less complete title-era context.",
  },
  "Kevin Durant (Nets)": {
    overall: 92,
    components: [94, 94, 78, 86, 94, 90],
    reason: "Nets Durant retains elite scoring but is a later, less durable version without deep playoff payoff.",
  },
  "Jerry West": {
    overall: 97,
    components: [97, 98, 93, 98, 98, 97],
    reason: "West anchor: historically elite guard, postseason reputation, honors, and era impact.",
  },
  "Nikola Jokic (2023)": {
    overall: 96,
    components: [98, 92, 78, 96, 92, 93],
    reason: "2023 Jokic anchor: historic offensive peak and title run, with longevity still below older legends.",
  },
  "Nikola Jokic (2025-26)": {
    overall: 96,
    components: [98, 93, 80, 96, 93, 93],
    reason: "Current Jokic remains an MVP-level all-time offensive engine; active-season evidence should still be reviewed.",
  },
  "Giannis Antetokounmpo (2025-26)": {
    overall: 96,
    components: [97, 93, 84, 94, 94, 93],
    reason: "Giannis anchor: MVP/DPOY-level two-way peak with title equity and active-career longevity still growing.",
  },
  "Dirk Nowitzki": {
    overall: 96,
    components: [96, 97, 97, 96, 96, 96],
    reason: "Dirk anchor: championship offensive big, elite longevity, and era-shaping spacing impact.",
  },
  "David Robinson": {
    overall: 96,
    components: [97, 95, 91, 91, 96, 92],
    reason: "Robinson anchor: MVP/DPOY two-way peak and elite regular-season impact.",
  },
  "Julius Erving": {
    overall: 96,
    components: [97, 96, 93, 94, 96, 98],
    reason: "Dr. J anchor: dominant peak, awards, ABA/NBA historical impact, and playoff stature.",
  },
  "Julius Erving (Nets)": {
    overall: 94,
    components: [96, 91, 84, 91, 91, 96],
    reason: "Nets Dr. J is a spectacular version, but separated from the full-career 76ers anchor.",
  },
  "Moses Malone": {
    overall: 96,
    components: [96, 97, 94, 96, 97, 92],
    reason: "Moses anchor: MVP force, title run, rebounding dominance, and career achievement.",
  },
  "Kevin Garnett (Timberwolves)": {
    overall: 95,
    components: [96, 94, 94, 88, 94, 94],
    reason: "Timberwolves KG anchor: MVP-level two-way peak with less playoff payoff than higher anchors.",
  },
  "Kevin Garnett (Celtics)": {
    overall: 92,
    components: [90, 95, 90, 94, 95, 93],
    reason: "Celtics KG is a title-winning defensive anchor version below his Minnesota peak.",
  },
  "Charles Barkley (Suns)": {
    overall: 95,
    components: [96, 94, 90, 91, 94, 92],
    reason: "Suns Barkley anchor: MVP peak and elite offensive/rebounding dominance.",
  },
  "Charles Barkley (76ers)": {
    overall: 94,
    components: [95, 91, 83, 86, 91, 90],
    reason: "76ers Barkley is a younger explosive version below the MVP Suns peak.",
  },
  "Karl Malone": {
    overall: 95,
    components: [95, 98, 98, 88, 97, 90],
    reason: "Malone anchor: massive regular-season achievement and longevity, moderated by playoff ceiling.",
  },
  "Dwayne Wade ('03 - '10)": {
    overall: 95,
    components: [97, 93, 84, 97, 93, 92],
    reason: "Prime Wade anchor: elite peak and playoff carry, with longevity below Kobe/LeBron tier.",
  },
  "Dwayne Wade ('10 - '14)": {
    overall: 93,
    components: [92, 94, 83, 94, 94, 91],
    reason: "Heatles Wade remains an elite title co-star, below the 2006-09 peak version.",
  },
  "Kawhi Leonard (Raptors)": {
    overall: 95,
    components: [96, 88, 72, 98, 91, 90],
    reason: "Raptors Kawhi anchor: title-run peak and playoff elevation, with limited longevity.",
  },
  "Kawhi Leonard (Spurs)": {
    overall: 91,
    components: [91, 86, 72, 88, 86, 87],
    reason: "Spurs Kawhi is an elite two-way ascent card below the Raptors playoff apex.",
  },
  "Steve Nash": {
    overall: 95,
    components: [95, 94, 90, 87, 95, 94],
    reason: "Nash anchor: two-time MVP offensive engine with transformational spacing and efficiency.",
  },
  "Allen Iverson (76ers)": {
    overall: 95,
    components: [96, 94, 87, 91, 94, 96],
    reason: "Iverson anchor: MVP peak, cultural impact, scoring pressure, and Finals run.",
  },
  "Scottie Pippen": {
    overall: 94,
    components: [94, 95, 92, 94, 95, 94],
    reason: "Pippen anchor: elite two-way second star, portability, titles, and defensive impact.",
  },
  "Chris Paul (Clippers)": {
    overall: 94,
    components: [94, 94, 91, 88, 94, 91],
    reason: "Clippers Paul anchor: elite point guard peak and regular-season impact, playoff ceiling moderated.",
  },
  "Chris Paul (Hornets)": {
    overall: 94,
    components: [95, 91, 80, 87, 91, 90],
    reason: "Hornets Paul is his most explosive creator version, near the Clippers anchor.",
  },
  "Isiah Thomas": {
    overall: 94,
    components: [94, 94, 88, 96, 94, 93],
    reason: "Isiah anchor: title lead guard, playoff elevation, and Bad Boys era impact.",
  },
  "John Stockton": {
    overall: 94,
    components: [92, 97, 100, 87, 95, 92],
    reason: "Stockton anchor: all-time longevity and creation efficiency, below higher peak engines.",
  },
  "Elgin Baylor": {
    overall: 94,
    components: [95, 94, 88, 88, 94, 94],
    reason: "Baylor anchor: era-dominant wing scorer and rebounder with elite historical stature.",
  },
  "Patrick Ewing": {
    overall: 94,
    components: [94, 93, 91, 90, 93, 90],
    reason: "Ewing anchor: franchise-center peak and longevity below the very top bigs.",
  },
  "Clyde Drexler (Blazers)": {
    overall: 93,
    components: [94, 93, 89, 91, 93, 90],
    reason: "Drexler anchor: Hall-of-Fame wing peak and Finals-level star value.",
  },
  "Tracy McGrady (Magic)": {
    overall: 93,
    components: [96, 86, 75, 78, 86, 88],
    reason: "Magic McGrady anchor: spectacular peak but short playoff and longevity resume.",
  },
  "Tracy McGrady (Rockets)": {
    overall: 92,
    components: [93, 87, 77, 78, 87, 87],
    reason: "Rockets McGrady is still elite but below the Magic scoring apex.",
  },
  "Ray Allen (Sonics)": {
    overall: 93,
    components: [93, 93, 93, 91, 93, 94],
    reason: "Ray Allen anchor: elite shooting star, longevity, and later title portability.",
  },
  "Reggie Miller": {
    overall: 93,
    components: [92, 92, 94, 94, 92, 95],
    reason: "Reggie anchor: playoff shotmaking, off-ball gravity, durability, and era-shaping movement shooting.",
  },
  "Dwight Howard": {
    overall: 93,
    components: [94, 91, 82, 88, 92, 88],
    reason: "Dwight anchor: three-time DPOY-level defensive peak and Finals-center value.",
  },
  "James Harden (Rockets)": {
    overall: 93,
    components: [97, 91, 83, 82, 91, 91],
    reason: "Rockets Harden anchor: MVP offensive peak, moderated by playoff translation.",
  },
  "Russell Westbrook": {
    overall: 92,
    components: [94, 91, 86, 80, 91, 92],
    reason: "Westbrook anchor: MVP peak and statistical impact, moderated by playoff scalability.",
  },
  "Jason Kidd": {
    overall: 93,
    components: [92, 94, 95, 91, 94, 91],
    reason: "Kidd anchor: elite two-way floor general, longevity, and title-era portability.",
  },
  "John Havlicek": {
    overall: 94,
    components: [94, 96, 94, 96, 96, 94],
    reason: "Havlicek anchor: championship two-way wing with elite longevity and playoff value.",
  },
  "George Mikan": {
    overall: 94,
    components: [96, 94, 88, 91, 94, 98],
    reason: "Mikan anchor: early-era dominant big and foundational historical force, era-adjusted below later inner-circle anchors.",
  },
  "Elvin Hayes (Bullets)": {
    overall: 93,
    components: [92, 95, 96, 89, 95, 90],
    reason: "Hayes anchor: elite longevity, title frontcourt value, and major statistical resume.",
  },
  "Dolph Schayes (Nationals)": {
    overall: 93,
    components: [93, 94, 92, 88, 94, 92],
    reason: "Schayes anchor: early-era star with strong honors, longevity, and shooting-forward impact.",
  },
  "Bill Walton": {
    overall: 93,
    components: [96, 88, 75, 95, 91, 91],
    reason: "Walton anchor: championship/MVP peak and playoff impact, heavily limited by longevity.",
  },
  "Bob Cousy": {
    overall: 93,
    components: [93, 96, 91, 93, 96, 96],
    reason: "Cousy anchor: era-defining lead guard, awards, titles, and playmaking influence.",
  },
  "George Gervin": {
    overall: 92,
    components: [94, 92, 89, 86, 92, 90],
    reason: "Gervin anchor: scoring-title superstar with elite peak offense but less playoff/two-way lift.",
  },
  "Dominique Wilkins": {
    overall: 92,
    components: [94, 92, 89, 84, 92, 91],
    reason: "Dominique anchor: explosive scoring superstar with strong longevity and limited deep playoff resume.",
  },
  "Nate Archibald": {
    overall: 92,
    components: [94, 91, 84, 88, 91, 90],
    reason: "Tiny Archibald anchor: rare scoring/playmaking peak and later title value.",
  },
  "Pete Maravich": {
    overall: 92,
    components: [94, 90, 78, 82, 90, 96],
    reason: "Maravich anchor: historic skill and cultural impact, with longevity/playoff limits.",
  },
  "Kevin McHale": {
    overall: 92,
    components: [92, 93, 86, 94, 93, 89],
    reason: "McHale anchor: elite post scorer and title frontcourt star below franchise-alpha legends.",
  },
  "Carmelo Anthony (Nuggets)": {
    overall: 91,
    components: [93, 91, 90, 82, 91, 90],
    reason: "Nuggets Melo anchor: high-end scorer with strong career value, moderated by defense and playoff impact.",
  },
  "Carmelo Anthony (Knicks)": {
    overall: 89,
    components: [91, 90, 85, 80, 90, 89],
    reason: "Knicks Melo is an elite scorer version below the more athletic Nuggets card.",
  },
  "Damian Lillard": {
    overall: 91,
    components: [93, 90, 84, 86, 90, 91],
    reason: "Lillard anchor: elite deep-range offensive peak and clutch identity, below MVP/title-anchor guards.",
  },
  "Jimmy Butler": {
    overall: 91,
    components: [91, 89, 80, 94, 88, 88],
    reason: "Butler anchor: playoff-elevating two-way wing, below higher regular-season achievement legends.",
  },
  "Grant Hill (Pistons)": {
    overall: 91,
    components: [93, 86, 75, 80, 86, 88],
    reason: "Pistons Grant Hill anchor: elite point-wing peak with injury-limited longevity.",
  },
  "Grant Hill": {
    overall: 86,
    components: [86, 86, 82, 78, 86, 86],
    reason: "Suns Grant Hill is a later-career connector version, far below the Pistons peak.",
  },
  "Dave Bing (Pistons)": {
    overall: 91,
    components: [92, 90, 86, 82, 90, 88],
    reason: "Bing anchor: Hall-of-Fame scoring guard with strong peak but below top guard anchors.",
  },
  "Dave DeBusschere (Knicks)": {
    overall: 91,
    components: [89, 92, 91, 93, 92, 89],
    reason: "DeBusschere anchor: championship two-way forward with elite defensive and role portability.",
  },
  "Hal Greer (76ers)": {
    overall: 91,
    components: [90, 92, 91, 88, 92, 89],
    reason: "Greer anchor: durable Hall-of-Fame guard and high-level title-era contributor.",
  },
};

const ACTIVE_CARD_ANCHORS = {
  "Luka Doncic (Mavs)": 96,
  "Luka Doncic (2025-26)": 95,
  "Shai Gilgeous-Alexander (2025-26)": 94,
  "Anthony Davis (Pelicans)": 92,
  "Anthony Davis (Lakers)": 91,
  "Anthony Davis (2025-26)": 89,
  "Victor Wembanyama (2025-26)": 91,
  "Anthony Edwards (2025-26)": 90,
  "Jayson Tatum (2025-26)": 90,
  "Donovan Mitchell (2025-26)": 89,
  "Jaylen Brown (2025-26)": 88,
  "Jalen Brunson (2025-26)": 88,
  "Devin Booker (2025-26)": 88,
  "Cade Cunningham (2025-26)": 87,
  "Tyrese Maxey (2025-26)": 87,
  "Chet Holmgren (2025-26)": 87,
  "Cooper Flagg (2025-26)": 83,
};

const BADGE_SIGNALS = {
  "Champion DNA": { career: 1.5, playoff: 1.5, honors: 0.7 },
  Clutch: { peak: 0.7, playoff: 1.8, impact: 0.4 },
  "Finals MVP": { career: 2.5, playoff: 2.5, honors: 2 },
  "Elite Shooter": { peak: 0.9, impact: 0.7 },
  "Off-Ball Gravity": { peak: 0.7, impact: 1.0 },
  "Deep Range": { peak: 0.8, impact: 0.8 },
  "Lockdown Defender": { peak: 1.0, honors: 0.7 },
  "Rim Protector": { peak: 0.7, honors: 0.5 },
  "Defensive IQ": { peak: 0.4, longevity: 0.4 },
  "Floor General": { peak: 0.7, impact: 0.6 },
  "Point Forward": { peak: 0.4, impact: 0.7 },
  Connector: { longevity: 0.3, playoff: 0.4 },
  "Iron Man": { longevity: 1.6 },
  "Triple-Double Machine": { peak: 0.8, impact: 0.6 },
  "Athletic Freak": { peak: 0.5 },
  "Three-Level Scorer": { peak: 0.7 },
  "Difficult Shot Maker": { peak: 0.6, playoff: 0.3 },
};

const csvEscape = (value) => {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const markdownEscape = (value) => String(value).replace(/\|/g, "\\|");

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const round1 = (value) => Math.round(value * 10) / 10;

const tierFromOverall = (overall) => TIER_RANGES.find((range) => overall >= range.min)?.tier ?? "Emerald";

const toPlayerId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const getPropertyName = (node) => {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  return undefined;
};

const expressionToValue = (node) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(expressionToValue);
  return undefined;
};

const objectValue = (objectLiteral, key) => {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    if (getPropertyName(property.name) !== key) continue;
    return expressionToValue(property.initializer);
  }
  return undefined;
};

const lineForNode = (source, node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

const extractCards = async () => {
  const cards = [];

  for (const filePath of SOURCE_FILES) {
    const sourceText = await fs.readFile(filePath, "utf8");
    const source = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const relativePath = path.relative(ROOT, filePath).replaceAll(path.sep, "/");

    const visit = (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const factory = node.expression.text;
        const firstArg = node.arguments[0];
        if ((factory === "makePlayer" || factory === "makeHistoricalVariant") && firstArg && ts.isObjectLiteralExpression(firstArg)) {
          const name = objectValue(firstArg, "name");
          const team = objectValue(firstArg, "teamLabel");
          const overall = objectValue(firstArg, "overall");
          const primaryPosition = objectValue(firstArg, "primaryPosition");

          if (typeof name === "string" && typeof team === "string" && typeof overall === "number") {
            cards.push({
              id: toPlayerId(name),
              name,
              cardName: name,
              team,
              era: objectValue(firstArg, "era") ?? (factory === "makeHistoricalVariant" ? "Team-specific historical variant" : ""),
              primaryPosition,
              secondaryPositions: objectValue(firstArg, "secondaryPositions") ?? [],
              currentOverall: overall,
              currentTier: tierFromOverall(overall),
              offense: objectValue(firstArg, "offense"),
              defense: objectValue(firstArg, "defense"),
              playmaking: objectValue(firstArg, "playmaking"),
              shooting: objectValue(firstArg, "shooting"),
              rebounding: objectValue(firstArg, "rebounding"),
              athleticism: objectValue(firstArg, "athleticism"),
              intangibles: objectValue(firstArg, "intangibles"),
              durability: objectValue(firstArg, "durability"),
              archetype: objectValue(firstArg, "archetype") ?? "",
              badges: objectValue(firstArg, "badges") ?? [],
              ballDominance: objectValue(firstArg, "ballDominance"),
              interiorDefense: objectValue(firstArg, "interiorDefense"),
              perimeterDefense: objectValue(firstArg, "perimeterDefense"),
              sourceFile: relativePath,
              sourceLine: lineForNode(source, node),
              factory,
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(source);
  }

  return cards;
};

const canonicalName = (name) =>
  name
    .replace(/\s*\(#\d+\)/g, "")
    .replace(/\s*\('[^']+'\)/g, "")
    .replace(/\s*\(2025-26\)/g, "")
    .replace(/\s*\([^)]+\)/g, "")
    .trim();

const componentNames = [
  "peakAbility",
  "careerAchievement",
  "longevity",
  "playoffPerformance",
  "awardsHonors",
  "historicalImpact",
];

const componentsFromAnchor = (components) =>
  Object.fromEntries(componentNames.map((name, index) => [name, components[index]]));

const scoreComponents = (card) => {
  const base = card.currentOverall;
  const isCurrentSeason = card.name.includes("(2025-26)");
  const isHistoricalVariant = card.factory === "makeHistoricalVariant";
  const badgeSignals = { peak: 0, career: 0, longevity: 0, playoff: 0, honors: 0, impact: 0 };

  for (const badge of card.badges) {
    const signal = BADGE_SIGNALS[badge];
    if (!signal) continue;
    badgeSignals.peak += signal.peak ?? 0;
    badgeSignals.career += signal.career ?? 0;
    badgeSignals.longevity += signal.longevity ?? 0;
    badgeSignals.playoff += signal.playoff ?? 0;
    badgeSignals.honors += signal.honors ?? 0;
    badgeSignals.impact += signal.impact ?? 0;
  }

  const archetype = card.archetype.toLowerCase();
  const name = card.name.toLowerCase();
  const rolePenalty =
    /bench|rotation|specialist|role|connector|glue/.test(archetype) || isHistoricalVariant ? 1.2 : 0;
  const titleSignal = /champion|dynasty|finals|title/.test(archetype) ? 1 : 0;
  const defenseSignal = /defensive|lockdown|stopper|anchor|rim/.test(archetype) ? 0.7 : 0;
  const scoringPeakSignal = /scoring|shot|engine|dominant|apex|mvp/.test(archetype) ? 0.8 : 0;
  const lateCareerPenalty = /heat\)|nets\)|celtics\)|lakers\)/.test(name) && !/lebron|kareem|wilt|rondo/.test(name) ? 0.9 : 0;
  const currentSeasonPenalty = isCurrentSeason ? 1.8 : 0;

  return {
    peakAbility: clamp(base + badgeSignals.peak + defenseSignal + scoringPeakSignal - rolePenalty * 0.4, 75, 99),
    careerAchievement: clamp(base - 2.5 + badgeSignals.career + titleSignal - currentSeasonPenalty, 75, 99),
    longevity: clamp(base - 3.5 + badgeSignals.longevity - currentSeasonPenalty - lateCareerPenalty, 75, 99),
    playoffPerformance: clamp(base - 2.2 + badgeSignals.playoff + titleSignal - currentSeasonPenalty * 0.5, 75, 99),
    awardsHonors: clamp(base - 2.8 + badgeSignals.honors + defenseSignal * 0.4 - currentSeasonPenalty, 75, 99),
    historicalImpact: clamp(base - 3.2 + badgeSignals.impact + scoringPeakSignal * 0.4 - rolePenalty * 0.5, 75, 99),
  };
};

const internalScore = (components) =>
  Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + components[key] * weight, 0);

const proposeFromInternal = (score) => {
  if (score >= 99.6) return 100;
  if (score >= 98.7) return 99;
  if (score >= 97.4) return 98;
  if (score >= 96.0) return 97;
  if (score >= 94.6) return 96;
  if (score >= 93.2) return 95;
  if (score >= 91.8) return 94;
  if (score >= 90.4) return 93;
  return clamp(Math.round(score), 75, 92);
};

const applyGuardrails = (card, proposed, exactAnchor) => {
  const reviewReasons = [];
  let adjusted = proposed;

  if (card.name !== "Michael Jordan" && adjusted >= 100) {
    adjusted = 99;
    reviewReasons.push("Non-Jordan cards are capped below 100.");
  }

  if (!exactAnchor && adjusted > 93) {
    adjusted = 93;
    reviewReasons.push("Unanchored card was capped at 93 pending verified historical evidence.");
  }

  if (!exactAnchor && card.name.includes("(2025-26)") && adjusted > 90) {
    adjusted = 90;
    reviewReasons.push("Unanchored current-season card was capped at 90 pending season evidence review.");
  }

  if (!exactAnchor && /cooper flagg|rookie|bronny|draft|before the glory|btg/i.test(`${card.name} ${card.archetype}`) && adjusted > 84) {
    adjusted = 84;
    reviewReasons.push("Rookie/prospect or before-the-glory card capped pending actual NBA resume review.");
  }

  adjusted = clamp(adjusted, 75, 100);

  return { adjusted, reviewReasons };
};

const nearestAnchors = (overall) => {
  const anchors = Object.entries({ ...EXACT_CARD_ANCHORS, ...Object.fromEntries(Object.entries(ACTIVE_CARD_ANCHORS).map(([name, rating]) => [name, { overall: rating }])) })
    .map(([name, value]) => ({ name, overall: value.overall }))
    .sort((left, right) => right.overall - left.overall || left.name.localeCompare(right.name));
  const upper = anchors.find((anchor) => anchor.overall >= overall);
  const lower = [...anchors].reverse().find((anchor) => anchor.overall <= overall);
  return {
    upper: upper ? `${upper.name} (${upper.overall})` : "",
    lower: lower ? `${lower.name} (${lower.overall})` : "",
  };
};

const buildProposal = (card) => {
  const activeAnchor = ACTIVE_CARD_ANCHORS[card.name];
  const exactAnchor = EXACT_CARD_ANCHORS[card.name];
  let components;
  let proposedOverall;
  let modelSource;
  let reasoning;
  let confidence;
  let evidenceLevel;

  if (exactAnchor) {
    components = componentsFromAnchor(exactAnchor.components);
    proposedOverall = exactAnchor.overall;
    modelSource = "exact-anchor";
    reasoning = exactAnchor.reason;
    confidence = "high";
    evidenceLevel = "curated historical anchor";
  } else if (activeAnchor) {
    components = scoreComponents(card);
    proposedOverall = activeAnchor;
    modelSource = "active-card-anchor";
    reasoning = `Active/current card anchor set to ${activeAnchor}; needs final stat-source validation before merge.`;
    confidence = "medium";
    evidenceLevel = "curated active-era anchor";
  } else {
    components = scoreComponents(card);
    proposedOverall = proposeFromInternal(internalScore(components));
    modelSource = "proxy-model";
    reasoning = "First-pass proxy from current OVR prior, badges, archetype, version context, and anchor-band guardrails.";
    confidence = card.currentOverall >= 90 || card.name.includes("(2025-26)") ? "low" : "medium";
    evidenceLevel = "game-data proxy; verify with Basketball Reference/NBA evidence before production merge";
  }

  const guardrails = applyGuardrails(card, proposedOverall, exactAnchor || activeAnchor);
  proposedOverall = guardrails.adjusted;

  const proposedTier = tierFromOverall(proposedOverall);
  const delta = proposedOverall - card.currentOverall;
  const reviewReasons = [...guardrails.reviewReasons];

  if (!exactAnchor && !activeAnchor && card.currentOverall >= 90) {
    reviewReasons.push("High-current-OVR card lacks exact historical anchor.");
  }
  if (card.name.includes("(2025-26)") && card.currentOverall >= 88) {
    reviewReasons.push("Current-season high-value card needs active-season evidence validation.");
  }
  if (Math.abs(delta) >= 4) {
    reviewReasons.push("Large proposed OVR delta.");
  }
  if (proposedTier !== card.currentTier) {
    reviewReasons.push(`Tier change: ${card.currentTier} to ${proposedTier}.`);
  }
  if (modelSource === "proxy-model") {
    reviewReasons.push("Proxy model used; no verified external statistical dataset attached.");
  }

  const anchors = nearestAnchors(proposedOverall);
  const score = round1(internalScore(components));

  return {
    ...card,
    canonicalName: canonicalName(card.name),
    proposedOverall,
    proposedTier,
    delta,
    internalScore: score,
    peakAbility: round1(components.peakAbility),
    careerAchievement: round1(components.careerAchievement),
    longevity: round1(components.longevity),
    playoffPerformance: round1(components.playoffPerformance),
    awardsHonors: round1(components.awardsHonors),
    historicalImpact: round1(components.historicalImpact),
    modelSource,
    confidence,
    evidenceLevel,
    nearestAnchorAboveOrEqual: anchors.upper,
    nearestAnchorBelowOrEqual: anchors.lower,
    manualReview: reviewReasons.length > 0,
    manualReviewReason: [...new Set(reviewReasons)].join(" | "),
    reasoning,
  };
};

const writeCsv = async (fileName, rows, columns) => {
  const header = columns.map((column) => csvEscape(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => csvEscape(column.value(row))).join(","));
  await fs.writeFile(path.join(OUTPUT_DIR, fileName), [header, ...body, ""].join("\n"), "utf8");
};

const writeJson = async (fileName, data) => {
  await fs.writeFile(path.join(OUTPUT_DIR, fileName), `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

const summaryMarkdown = (proposals) => {
  const top50 = [...proposals].sort((a, b) => b.proposedOverall - a.proposedOverall || b.internalScore - a.internalScore || a.name.localeCompare(b.name)).slice(0, 50);
  const increases = proposals.filter((row) => row.delta > 0).sort((a, b) => b.delta - a.delta || b.proposedOverall - a.proposedOverall).slice(0, 25);
  const decreases = proposals.filter((row) => row.delta < 0).sort((a, b) => a.delta - b.delta || b.currentOverall - a.currentOverall).slice(0, 25);
  const manual = proposals.filter((row) => row.manualReview);
  const tierChanges = proposals.filter((row) => row.currentTier !== row.proposedTier);

  const table = (rows) => [
    "| Player | Team | Current | Proposed | Delta | Reason |",
    "|---|---|---:|---:|---:|---|",
    ...rows.map((row) => `| ${markdownEscape(row.name)} | ${markdownEscape(row.team)} | ${row.currentOverall} | ${row.proposedOverall} | ${row.delta > 0 ? `+${row.delta}` : row.delta} | ${markdownEscape(row.reasoning)} |`),
  ].join("\n");

  return [
    "# Player Rating Proposal Summary",
    "",
    "This is a review artifact. It does not modify production ratings.",
    "",
    `Total cards reviewed: ${proposals.length}`,
    `Manual-review candidates: ${manual.length}`,
    `Tier changes proposed: ${tierChanges.length}`,
    "",
    "## Top 50 Proposed Ratings",
    "",
    table(top50),
    "",
    "## Largest Proposed Increases",
    "",
    table(increases),
    "",
    "## Largest Proposed Decreases",
    "",
    table(decreases),
    "",
    "## Manual Review Notes",
    "",
    "- All proxy-model outputs should be checked against Basketball Reference/NBA evidence before production merge.",
    "- Current-season cards rated 88+ are intentionally flagged because active-season or future-season evidence can shift quickly.",
    "- Large deltas usually mean the current game value is not aligned with the anchor scale, or the card version needs a hand-authored anchor.",
    "",
  ].join("\n");
};

const run = async () => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const cards = await extractCards();
  const proposals = cards.map(buildProposal).sort((a, b) => b.proposedOverall - a.proposedOverall || b.internalScore - a.internalScore || a.name.localeCompare(b.name));

  const backupRows = cards.sort((a, b) => b.currentOverall - a.currentOverall || a.name.localeCompare(b.name));

  await writeJson("current-player-ratings-backup.json", backupRows);
  await writeCsv("current-player-ratings-backup.csv", backupRows, [
    { label: "id", value: (row) => row.id },
    { label: "player_name", value: (row) => row.name },
    { label: "card_name_version", value: (row) => row.cardName },
    { label: "team", value: (row) => row.team },
    { label: "era", value: (row) => row.era },
    { label: "primary_position", value: (row) => row.primaryPosition },
    { label: "secondary_positions", value: (row) => row.secondaryPositions.join(";") },
    { label: "current_ovr", value: (row) => row.currentOverall },
    { label: "current_tier", value: (row) => row.currentTier },
    { label: "offense", value: (row) => row.offense },
    { label: "defense", value: (row) => row.defense },
    { label: "playmaking", value: (row) => row.playmaking },
    { label: "shooting", value: (row) => row.shooting },
    { label: "rebounding", value: (row) => row.rebounding },
    { label: "athleticism", value: (row) => row.athleticism },
    { label: "intangibles", value: (row) => row.intangibles },
    { label: "durability", value: (row) => row.durability },
    { label: "badges", value: (row) => row.badges.join(";") },
    { label: "archetype", value: (row) => row.archetype },
    { label: "source_file", value: (row) => row.sourceFile },
    { label: "source_line", value: (row) => row.sourceLine },
  ]);

  const proposalColumns = [
    { label: "id", value: (row) => row.id },
    { label: "player_name", value: (row) => row.name },
    { label: "canonical_name", value: (row) => row.canonicalName },
    { label: "card_name_version", value: (row) => row.cardName },
    { label: "team", value: (row) => row.team },
    { label: "era", value: (row) => row.era },
    { label: "primary_position", value: (row) => row.primaryPosition },
    { label: "secondary_positions", value: (row) => row.secondaryPositions.join(";") },
    { label: "current_ovr", value: (row) => row.currentOverall },
    { label: "proposed_ovr", value: (row) => row.proposedOverall },
    { label: "delta", value: (row) => row.delta },
    { label: "current_tier", value: (row) => row.currentTier },
    { label: "proposed_tier", value: (row) => row.proposedTier },
    { label: "internal_score", value: (row) => row.internalScore },
    { label: "peak_ability", value: (row) => row.peakAbility },
    { label: "career_achievement", value: (row) => row.careerAchievement },
    { label: "longevity", value: (row) => row.longevity },
    { label: "playoff_performance", value: (row) => row.playoffPerformance },
    { label: "awards_honors", value: (row) => row.awardsHonors },
    { label: "historical_impact", value: (row) => row.historicalImpact },
    { label: "badges", value: (row) => row.badges.join(";") },
    { label: "archetype", value: (row) => row.archetype },
    { label: "model_source", value: (row) => row.modelSource },
    { label: "confidence", value: (row) => row.confidence },
    { label: "evidence_level", value: (row) => row.evidenceLevel },
    { label: "nearest_anchor_above_or_equal", value: (row) => row.nearestAnchorAboveOrEqual },
    { label: "nearest_anchor_below_or_equal", value: (row) => row.nearestAnchorBelowOrEqual },
    { label: "manual_review", value: (row) => row.manualReview ? "yes" : "no" },
    { label: "manual_review_reason", value: (row) => row.manualReviewReason },
    { label: "reasoning", value: (row) => row.reasoning },
    { label: "source_file", value: (row) => row.sourceFile },
    { label: "source_line", value: (row) => row.sourceLine },
  ];

  await writeJson("proposed-player-ratings.json", proposals);
  await writeCsv("proposed-player-ratings.csv", proposals, proposalColumns);

  const manualReviewRows = proposals
    .filter((row) => row.manualReview)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.currentOverall - a.currentOverall || a.name.localeCompare(b.name));

  await writeCsv("manual-review-candidates.csv", manualReviewRows, [
    { label: "player_name", value: (row) => row.name },
    { label: "team", value: (row) => row.team },
    { label: "current_ovr", value: (row) => row.currentOverall },
    { label: "proposed_ovr", value: (row) => row.proposedOverall },
    { label: "delta", value: (row) => row.delta },
    { label: "current_tier", value: (row) => row.currentTier },
    { label: "proposed_tier", value: (row) => row.proposedTier },
    { label: "model_source", value: (row) => row.modelSource },
    { label: "confidence", value: (row) => row.confidence },
    { label: "manual_review_reason", value: (row) => row.manualReviewReason },
    { label: "reasoning", value: (row) => row.reasoning },
  ]);

  await fs.writeFile(path.join(OUTPUT_DIR, "proposed-player-ratings-summary.md"), summaryMarkdown(proposals), "utf8");

  const distribution = proposals.reduce((accumulator, row) => {
    accumulator[row.proposedOverall] = (accumulator[row.proposedOverall] ?? 0) + 1;
    return accumulator;
  }, {});

  const summary = {
    totalCards: proposals.length,
    exactAnchorCards: proposals.filter((row) => row.modelSource === "exact-anchor").length,
    activeAnchorCards: proposals.filter((row) => row.modelSource === "active-card-anchor").length,
    proxyModelCards: proposals.filter((row) => row.modelSource === "proxy-model").length,
    manualReviewCandidates: proposals.filter((row) => row.manualReview).length,
    tierChanges: proposals.filter((row) => row.currentTier !== row.proposedTier).length,
    onlyHundred: proposals.filter((row) => row.proposedOverall === 100).map((row) => row.name),
    proposedOverallDistribution: Object.fromEntries(Object.entries(distribution).sort((left, right) => Number(right[0]) - Number(left[0]))),
  };

  await writeJson("proposal-run-summary.json", summary);

  console.log(JSON.stringify(summary, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
