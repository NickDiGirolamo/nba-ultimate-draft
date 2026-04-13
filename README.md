# Legends Draft

Legends Draft is a polished single-page NBA team-building game inspired by Ultimate Team draft modes. You draft one all-time player out of five each round, build a full 10-man roster, then simulate an NBA regular season and playoff run based on roster strength, fit, depth, spacing, defense, and variance.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Release workflow

Production should deploy from `main` through Vercel, with one release thread responsible for final pushes.

- Worker threads do their work on feature branches and commit completed changes
- The release thread integrates approved work onto `main`
- Run `npm run release:check` before pushing `main`

Detailed instructions live in `docs/RELEASE_WORKFLOW.md`.

## What the game includes

- A full 10-round draft loop with 5 unique player choices per pick
- 84 all-time NBA players across multiple eras, positions, and quality tiers
- Automatic roster slot assignment for starters and bench roles
- Local persistence so refreshes do not wipe the current run
- A season simulation engine that weighs both overall talent and lineup construction
- A polished results screen with record, seed, playoff finish, team narrative, strengths, weaknesses, MVP, and X-factor

## Where to expand the player pool

Edit the player dataset in:

- `src/data/players.ts`

Each player entry is a structured object with ratings, position flexibility, badges, and simulation-facing fields such as ball dominance, interior defense, and perimeter defense.

## Where the simulation logic lives

- Draft generation and roster assignment: `src/lib/draft.ts`
- Team evaluation and season/playoff simulation: `src/lib/simulate.ts`
- Game state and localStorage persistence: `src/hooks/useDraftGame.ts`

## Notes on design and balancing

- Star power matters, but fit matters too
- Teams with no lead creator, weak spacing, no rim protection, or overloaded positional redundancy are penalized
- Strong benches, elite shooting, wing defense, and at least one real defensive big meaningfully improve outcomes
- The simulation uses deterministic seeded randomness so each run feels varied without becoming chaotic
