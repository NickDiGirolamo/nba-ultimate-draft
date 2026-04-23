export interface NbaTeam {
  name: string;
  abbreviation: string;
  logo: string | null;
  division: string;
  conference: string;
}

export const nbaTeams: NbaTeam[] = [
  { name: "Washington Wizards", abbreviation: "Was", logo: "https://upload.wikimedia.org/wikipedia/en/0/02/Washington_Wizards_logo.svg", division: "Southeast", conference: "East" },
  { name: "Boston Celtics", abbreviation: "Bos", logo: "https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg", division: "Atlantic", conference: "East" },
  { name: "Atlanta Hawks", abbreviation: "Atl", logo: "https://a.espncdn.com/guid/15096a54-f015-c987-5ec8-55afedf6272f/logos/primary_logo_on_primary_color.png", division: "Southeast", conference: "East" },
  { name: "Toronto Raptors", abbreviation: "Tor", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/3/36/Toronto_Raptors_logo.svg/250px-Toronto_Raptors_logo.svg.png", division: "Atlantic", conference: "East" },
  { name: "Indiana Pacers", abbreviation: "Ind", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/Indiana_Pacers.svg/1280px-Indiana_Pacers.svg.png", division: "Central", conference: "East" },
  { name: "Orlando Magic", abbreviation: "Orl", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/10/Orlando_Magic_logo.svg/1280px-Orlando_Magic_logo.svg.png", division: "Southeast", conference: "East" },
  { name: "Charlotte Hornets", abbreviation: "Cha", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c4/Charlotte_Hornets_%282014%29.svg/1280px-Charlotte_Hornets_%282014%29.svg.png", division: "Southeast", conference: "East" },
  { name: "Milwaukee Bucks", abbreviation: "Mil", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/Milwaukee_Bucks_logo.svg/1280px-Milwaukee_Bucks_logo.svg.png", division: "Central", conference: "East" },
  { name: "Detroit Pistons", abbreviation: "Det", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Logo_of_the_Detroit_Pistons.svg/1280px-Logo_of_the_Detroit_Pistons.svg.png", division: "Central", conference: "East" },
  { name: "New York Knicks", abbreviation: "Nyk", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/25/New_York_Knicks_logo.svg/1280px-New_York_Knicks_logo.svg.png", division: "Atlantic", conference: "East" },
  { name: "Brooklyn Nets", abbreviation: "Bro", logo: "https://static.wikia.nocookie.net/nba2k/images/6/64/Brooklyn_Nets.png/revision/latest?cb=20250411145940", division: "Atlantic", conference: "East" },
  { name: "Miami Heat", abbreviation: "Mia", logo: "https://upload.wikimedia.org/wikipedia/en/f/fb/Miami_Heat_logo.svg", division: "Southeast", conference: "East" },
  { name: "Philadelphia 76ers", abbreviation: "Phi", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Philadelphia_76ers_logo.svg/1280px-Philadelphia_76ers_logo.svg.png", division: "Atlantic", conference: "East" },
  { name: "Chicago Bulls", abbreviation: "Chi", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Chicago_Bulls_logo.svg/1280px-Chicago_Bulls_logo.svg.png", division: "Central", conference: "East" },
  { name: "Cleveland Cavaliers", abbreviation: "Cle", logo: "https://cdn.nba.com/teams/legacy/i.cdn.turner.com/nba/nba/.element/media/2.0/teamsites/cavaliers/images/170531-global-logo.png", division: "Central", conference: "East" },
  { name: "Sacramento Kings", abbreviation: "Sac", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c7/SacramentoKings.svg/1280px-SacramentoKings.svg.png", division: "Pacific", conference: "West" },
  { name: "Los Angeles Lakers", abbreviation: "Lal", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_Angeles_Lakers_logo.svg/1280px-Los_Angeles_Lakers_logo.svg.png", division: "Pacific", conference: "West" },
  { name: "Los Angeles Clippers", abbreviation: "Lac", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/e/ed/Los_Angeles_Clippers_%282024%29.svg/1280px-Los_Angeles_Clippers_%282024%29.svg.png", division: "Pacific", conference: "West" },
  { name: "New Orleans Pelicans", abbreviation: "Nor", logo: "https://dejpknyizje2n.cloudfront.net/media/carstickers/versions/new-orleans-pelicans-nba-logo-sticker-ueb49-c7cd-x418.png", division: "Southwest", conference: "West" },
  { name: "Dallas Mavericks", abbreviation: "Dal", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/97/Dallas_Mavericks_logo.svg/250px-Dallas_Mavericks_logo.svg.png", division: "Southwest", conference: "West" },
  { name: "San Antonio Spurs", abbreviation: "San", logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/San_Antonio_Spurs.svg", division: "Southwest", conference: "West" },
  { name: "Houston Rockets", abbreviation: "Hou", logo: "https://upload.wikimedia.org/wikipedia/en/2/28/Houston_Rockets.svg", division: "Southwest", conference: "West" },
  { name: "Oklahoma City Thunder", abbreviation: "Okc", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Oklahoma_City_Thunder.svg/1280px-Oklahoma_City_Thunder.svg.png", division: "Northwest", conference: "West" },
  { name: "Phoenix Suns", abbreviation: "Pho", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/dc/Phoenix_Suns_logo.svg/1280px-Phoenix_Suns_logo.svg.png", division: "Pacific", conference: "West" },
  { name: "Golden State Warriors", abbreviation: "Gol", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/01/Golden_State_Warriors_logo.svg/1280px-Golden_State_Warriors_logo.svg.png", division: "Pacific", conference: "West" },
  { name: "Portland Trail Blazers", abbreviation: "Por", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/21/Portland_Trail_Blazers_logo.svg/1280px-Portland_Trail_Blazers_logo.svg.png", division: "Northwest", conference: "West" },
  { name: "Memphis Grizzlies", abbreviation: "Mem", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Memphis_Grizzlies.svg/1280px-Memphis_Grizzlies.svg.png", division: "Southwest", conference: "West" },
  { name: "Minnesota Timberwolves", abbreviation: "Min", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c2/Minnesota_Timberwolves_logo.svg/250px-Minnesota_Timberwolves_logo.svg.png", division: "Northwest", conference: "West" },
  { name: "Utah Jazz", abbreviation: "Uta", logo: "https://content.sportslogos.net/logos/6/234/full/utah-jazz-logo-primary-2026-1109.png", division: "Northwest", conference: "West" },
  { name: "Denver Nuggets", abbreviation: "Den", logo: "https://upload.wikimedia.org/wikipedia/en/7/76/Denver_Nuggets.svg", division: "Northwest", conference: "West" },
];

const teamNameAliases: Record<string, string> = {
  hawks: "Atlanta Hawks",
  celtics: "Boston Celtics",
  nets: "Brooklyn Nets",
  hornets: "Charlotte Hornets",
  bulls: "Chicago Bulls",
  cavaliers: "Cleveland Cavaliers",
  mavericks: "Dallas Mavericks",
  nuggets: "Denver Nuggets",
  pistons: "Detroit Pistons",
  warriors: "Golden State Warriors",
  rockets: "Houston Rockets",
  pacers: "Indiana Pacers",
  clippers: "Los Angeles Clippers",
  lakers: "Los Angeles Lakers",
  grizzlies: "Memphis Grizzlies",
  heat: "Miami Heat",
  bucks: "Milwaukee Bucks",
  timberwolves: "Minnesota Timberwolves",
  pelicans: "New Orleans Pelicans",
  knicks: "New York Knicks",
  thunder: "Oklahoma City Thunder",
  magic: "Orlando Magic",
  sixers: "Philadelphia 76ers",
  "76ers": "Philadelphia 76ers",
  suns: "Phoenix Suns",
  blazers: "Portland Trail Blazers",
  "trail blazers": "Portland Trail Blazers",
  kings: "Sacramento Kings",
  spurs: "San Antonio Spurs",
  raptors: "Toronto Raptors",
  jazz: "Utah Jazz",
  wizards: "Washington Wizards",
};

const normalizeTeamName = (value: string) => value.trim().toLowerCase();

export const getNbaTeamByName = (teamName: string) => {
  const normalizedInput = normalizeTeamName(teamName);
  const directMatch =
    nbaTeams.find((team) => normalizeTeamName(team.name) === normalizedInput) ?? null;
  if (directMatch) return directMatch;

  const segments = teamName
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const normalizedSegment = normalizeTeamName(segment);
    const aliasTarget = teamNameAliases[normalizedSegment];
    if (aliasTarget) {
      const aliasedTeam = nbaTeams.find((team) => team.name === aliasTarget);
      if (aliasedTeam) return aliasedTeam;
    }

    const exactSegmentMatch =
      nbaTeams.find((team) => normalizeTeamName(team.name) === normalizedSegment) ?? null;
    if (exactSegmentMatch) return exactSegmentMatch;

    const suffixMatch =
      nbaTeams.find((team) => normalizeTeamName(team.name).endsWith(` ${normalizedSegment}`)) ?? null;
    if (suffixMatch) return suffixMatch;
  }

  return null;
};
