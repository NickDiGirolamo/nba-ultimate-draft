# AGENTS.md

## Product Priorities
- Build a polished, replayable NBA fantasy draft game with strong progression, clear strategy, and high emotional payoff.
- Keep NBA Rogue Mode as the primary experience and homepage focus.
- Prioritize clarity, momentum, and user excitement over unnecessary complexity.
- Treat player images, badges, roster feedback, challenge progression, and unlock/reward payoff as core parts of the experience.

## Coding Rules
- Read the current code and follow existing patterns before changing behavior.
- Keep solutions direct, readable, and easy to reason about.
- Prefer small helpers over deeply nested logic.
- Reuse existing utilities and patterns before introducing new abstractions.
- Avoid unnecessary refactors when solving a focused problem.
- Preserve saved-state compatibility whenever possible.

## Gameplay/Data Invariants
- Do not change existing player overall ratings.
- Do not add or rename stat categories. Keep: `overall`, `offense`, `defense`, `playmaking`, `shooting`, `rebounding`, `athleticism`, `intangibles`.
- When editing player data, make sure the change carries through:
  - player data
  - player ID references
  - badge/synergy logic
  - saved-state migration if needed
  - visible card/display output
- When changing challenge logic, also verify related results-screen messaging and reward payout.
- When changing roster or simulation systems, keep UI feedback aligned with the underlying logic.
- Prefer complete end-to-end behavior over partial UI-only changes.

## UI/UX Guardrails
- The game should feel premium, readable, and intentional.
- Important actions, outcomes, rewards, and unlocks should be obvious at a glance.
- New users should be guided clearly toward the main intended experience.
- Tooltips, badges, roster changes, challenge outcomes, and progression rewards should clearly explain themselves.
- Minimize dead space, clipping, overflow, awkward wrapping, and inconsistent alignment.
- Whenever navigation or a major state change moves the user to a new page, section, modal, screen, or major view, reset scroll position to the top.

## Card Layout Rules
- Player images are first-class UI elements and should be displayed as cleanly as possible.
- Card Lab designs are the visual source of truth for major player-card layouts.
- On player cards, never solve long names with clipping or ellipses when the full name should be visible; reduce font size as needed.
- Full player cards and run-roster cards are fixed composition templates. Preserve their approved relative proportions, object placement, and player-image crop.
- If a player card or run-roster card needs to appear smaller or larger, scale the entire card uniformly as one object.
- Do not independently resize internal card elements.
- Do not introduce responsive reflow, compact rearrangements, object repositioning, or alternate crop behavior inside player cards or run-roster cards.
- If cards need to fit a tighter space, change the surrounding layout rather than altering internal card composition.

## Quality Bar
- Do not leave UI in a half-finished, misleading, or inconsistent state.
- Do not introduce vague player-facing labels or metrics without clear explanation.
- Do not break saved progress unless absolutely necessary.
- Do not let cards, panels, badges, or tooltips overflow or clip.
- Do not weaken the emotional value of rare cards, unlocks, challenge clears, rewards, or progression.

## Verification
- Keep the app buildable whenever possible.
- Assume both local preview and Vercel deployment matter.
- Avoid changes that silently break the gameplay loop, onboarding flow, results screens, progression, rewards, or saved history.
- Run a build check after meaningful changes when feasible.
