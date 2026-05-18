# Player Rating Methodology

This document defines a repeatable review process for recalculating NBA Ultimate Draft player-card overall ratings without immediately overwriting production player data.

## Current Data Structure

Player cards are seeded in two TypeScript data files:

- `src/data/players.ts`
  - Defines historical and special player cards.
  - Uses `makePlayer(...)` for fully specified cards.
  - Uses `makeHistoricalVariant(...)` for version cards that inherit stat-shape presets from historical profile types.
  - Exports `allPlayers` by combining historical cards with current-season cards.
- `src/data/players-current-2026.ts`
  - Defines 2025-26 current-season cards.
  - Uses `makePlayer(...)` with the same seed shape.

The runtime player shape is defined by `Player` in `src/types/index.ts`.

Each player card includes:

- Identity: `id`, `name`, `era`, `teamLabel`
- Card version information: usually embedded in `name`, such as `Kobe Bryant (#24)` or `Latrell Sprewell (Timberwolves)`
- Position: `primaryPosition`, `secondaryPositions`
- Overall anchor: `overall`
- Backend stat categories: `offense`, `defense`, `playmaking`, `shooting`, `rebounding`, `athleticism`, `intangibles`
- Additional gameplay ratings: `durability`, `ballDominance`, `interiorDefense`, `perimeterDefense`
- Card metadata: `archetype`, `hallOfFameTier`, `shortDescription`, `badges`

`makePlayer(...)` normalizes backend stat categories around the supplied `overall` through `normalizePlayerSeedRatings(...)` in `src/lib/playerRatings.ts`. This means the source `overall` is the anchor value, while backend stat values are adjusted to maintain budget consistency.

Tiers are derived from `overall` in `src/lib/playerTier.ts`:

| OVR Range | Tier |
|---:|---|
| 96-100 | Galaxy |
| 91-95 | Amethyst |
| 86-90 | Ruby |
| 80-85 | Sapphire |
| 75-79 | Emerald |

The rebalance process must preserve production data until a proposed file has been reviewed.

## Rating Goal

Every unique player card should be rated relative to all NBA history, not only relative to nearby cards in the existing game data.

The game-scale constraints are:

- Michael Jordan is the only `100`.
- No other card may equal `100`.
- The minimum allowed overall is `75`.
- Version cards can and should differ from the player's prime all-time version.
- The final scale should preserve meaningful gameplay separation between legends, stars, starters, specialists, and bench players.

## Internal Historical Score

Each card receives a hidden internal historical score before converting to game OVR.

The internal score is a weighted blend:

| Component | Weight | Definition |
|---|---:|---|
| Peak Ability | 35% | Best-season or best-stretch dominance, including two-way impact, advanced metrics, efficiency, and peak playoff quality |
| Career Achievement | 25% | Championships, Finals MVPs, MVPs, All-NBA, All-Star selections, scoring titles, DPOY, statistical milestones, and historical rankings |
| Longevity | 15% | Years as a positive player, years as an elite player, durability, sustained consistency |
| Playoff Performance | 10% | Postseason translation, Finals performance, clutch reputation, efficiency, and deep playoff success |
| Awards / Honors | 10% | MVP, Finals MVP, DPOY, All-NBA, All-Defense, ROY, NBA anniversary teams, Hall of Fame recognition |
| Historical / Era Impact | 5% | Era-adjusted dominance, game-changing influence, cultural impact, strategic innovation |

Formula:

```text
internal_score =
  0.35 * peak_ability +
  0.25 * career_achievement +
  0.15 * longevity +
  0.10 * playoff_performance +
  0.10 * awards_honors +
  0.05 * historical_impact
```

The internal score is then normalized into the 75-100 game scale using anchor-player bands.

## Anchor Normalization

The rating system uses anchor players as fixed reference points. Every proposed rating should be explainable by the nearest players above and below it.

Primary top-scale anchors:

| OVR | Anchor Meaning |
|---:|---|
| 100 | Michael Jordan only |
| 99 | LeBron James peak Cleveland version |
| 98 | Inner-circle all-time peaks such as Kareem Abdul-Jabbar, Shaquille O'Neal, Tim Duncan, Kobe Bryant, Stephen Curry, Wilt Chamberlain, Bill Russell, Magic Johnson, Larry Bird |
| 97 | All-time top-tier legends such as Hakeem Olajuwon, Oscar Robertson, Kevin Durant, Jerry West |
| 96 | MVP-level all-time greats such as Nikola Jokic, Giannis Antetokounmpo, Dirk Nowitzki, David Robinson, Julius Erving, Moses Malone |
| 95 | Lower inner-circle or elite MVP-tier stars such as Kevin Garnett, Charles Barkley, Karl Malone, Dwyane Wade, Kawhi Leonard, Steve Nash, Allen Iverson |
| 94 | Elite legends and top-tier second stars such as Scottie Pippen, Chris Paul, Isiah Thomas, John Stockton, Elgin Baylor, Patrick Ewing |
| 92-93 | Hall-of-Fame stars, peak-first stars, or major offensive engines such as Reggie Miller, Tracy McGrady, Clyde Drexler, Ray Allen, Dwight Howard, James Harden, Russell Westbrook |
| 88-91 | Fringe superstars, multi-time All-Stars, strong playoff stars |
| 82-87 | High-end starters, one-time All-Stars, elite role players |
| 75-81 | Rotation players, specialists, bench players |

## Card Version Rules

Different versions of the same player should be rated separately.

- Prime version: highest rating, based on the player's best all-time version.
- Rookie / Before The Glory version: materially lower, based on actual early-career quality.
- Older / late-career version: reduced for decline in athleticism, role, durability, and defensive coverage.
- Role-player version: rated by actual role value rather than name recognition.
- What-if / special cards: can exceed realistic historical outcomes only if the card's game design explicitly justifies it.
- Current-season cards: should be treated as season snapshots and flagged for manual review when future or incomplete-season evidence is uncertain.

## Evidence Hierarchy

Use the best available evidence in this order:

1. Curated anchor-player decisions from the methodology.
2. Basketball Reference, NBA official records, or equivalent structured historical data when available.
3. Advanced metrics: BPM, playoff BPM, VORP, WS/48, PER, MVP shares.
4. Awards and honors: MVP, Finals MVP, All-NBA, All-Defense, DPOY, All-Star, scoring titles.
5. Championship role context: primary engine, co-star, defensive anchor, high-leverage role player.
6. Existing game data as a prior, especially for low-visibility role-player cards.
7. Badge, archetype, and position proxies for repeatable first-pass scoring.

The proposal utility must mark cards as manual-review candidates when it relies mostly on existing game priors rather than verified historical evidence.

## Repeatable Process

1. Extract every unique player card from `players.ts` and `players-current-2026.ts`.
2. Save a backup of current source ratings and metadata.
3. Apply exact anchor ratings for known top historical cards.
4. Apply version adjustments for prime, older, current-season, role-player, and special versions.
5. Estimate category scores using the weighted methodology.
6. Normalize internal scores into final OVR with anchor bands.
7. Clamp final OVR to `75-100`, with Michael Jordan as the only `100`.
8. Recompute proposed tier from proposed OVR.
9. Output current OVR, proposed OVR, delta, internal score, category scores, reasoning, confidence, and manual-review flags.
10. Review the proposal before any production rating edit.

## Manual Review Triggers

A card should be reviewed manually if any of the following are true:

- Current or proposed OVR is `90+` and the card is not an exact anchor.
- Proposed delta is at least `4` points.
- Proposed tier changes.
- The card is a 2025-26 current-season card rated `88+`.
- The card is a rookie, prospect, late-career version, or special/what-if card.
- Multiple versions of the same player appear out of expected order.
- The script could not use verified historical evidence.

## Production Merge Rule

Do not merge proposed ratings into `src/data` until the proposal artifacts are reviewed. When production ratings are eventually edited, backend stat categories must be regenerated or validated so their budget remains aligned to each new `overall`.
