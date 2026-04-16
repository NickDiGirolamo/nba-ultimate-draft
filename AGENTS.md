# AGENTS.md

## Project Purpose
- Build a polished, replayable NBA fantasy draft game with strong progression, clear strategy, and high emotional payoff.
- Prioritize user excitement, clarity, and momentum over unnecessary complexity.
- Treat player images, badges, challenge progression, and roster-building feedback as core parts of the experience.
- Make the game feel rewarding for both new users and returning users.

## Code Style Preferences
- Keep code readable, direct, and easy to reason about.
- Prefer small helper functions over deeply nested logic.
- Reuse existing patterns and utilities before introducing new abstractions.
- Keep naming clear and descriptive, especially for gameplay logic.
- Avoid unnecessary refactors when solving a focused problem.
- Preserve compatibility with existing saved state whenever possible.

## UI/UX Expectations
- The game should feel premium, readable, and intentional.
- Player images must always be treated as first-class UI elements and displayed as cleanly as possible.
- Important actions and outcomes should be obvious at a glance.
- New users should be guided toward the main intended experience without confusion.
- Tooltips, badges, roster changes, challenge outcomes, and progression rewards should all clearly explain themselves.
- Whenever a button, link, or other navigation action moves the user to a new page, screen, section, modal, or major state, reset scroll position to the top so the destination view starts at the top by default.
- Minimize dead space, clipping, overflow, awkward text wrapping, and inconsistent alignment.
- If a user earns or unlocks something, the payoff should feel visible and rewarding.

## Workflow Rules
- Understand the current code before changing behavior.
- When editing player data, make sure the change carries through:
  - player data
  - player ID references
  - badge/synergy logic
  - saved-state migration if needed
  - visible card/display output
- When changing challenge logic, also verify related results-screen messaging and reward payout.
- When changing roster or simulation systems, keep UI feedback aligned with the underlying logic.
- Prefer implementing complete end-to-end behavior instead of leaving partial UI-only changes.
- Run a build check after meaningful changes when feasible.

## Deployment Expectations
- Keep the app in a buildable state whenever possible.
- Assume local preview and Vercel deployment both matter.
- Avoid changes that silently break the live gameplay loop, onboarding flow, or results screens.
- If a feature affects progression, challenges, rewards, or saved history, verify that behavior carefully before considering it done.

## Things To Avoid
- Do not leave UI in a half-finished or misleading state.
- Do not introduce vague player-facing metrics or labels without clear explanation.
- Do not break saved progress unless absolutely necessary.
- Do not let cards, panels, badges, or tooltips overflow, clip, or behave inconsistently.
- Do not weaken the emotional value of rare cards, challenge clears, unlocks, or progression rewards.
- Do not add complexity that makes the game harder to understand without making it more fun.
