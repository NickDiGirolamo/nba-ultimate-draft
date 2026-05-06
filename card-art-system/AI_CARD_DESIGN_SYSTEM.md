# AI Card Design System

This is the source-of-truth guardrail document for the isolated AI Art Cards lab. It governs AI-generated full-art cards, tier background studies, and future visual experiments in the AI card direction.

It does not override the approved live gameplay card templates unless a future task explicitly promotes an AI card design into gameplay.

## Core Principles

- The player is the first read on full-art cards.
- The tier is the second read through material, color, light, border treatment, and background atmosphere.
- Overall rating, natural positions, and player name must remain readable at full size, compact size, and mobile-grid size.
- Premium should come from polish, contrast, lighting, material quality, and restraint rather than clutter.
- Card Lab experiments should stay isolated until intentionally integrated into the main game.

## Composition Rules

- The player's overall rating must always appear in the top-left corner of the card face.
- The player's natural positions must always appear directly beneath the overall rating in the top-left corner.
- The player's full first and last name must always be shown on the card face.
- Player names must never be abbreviated, cut off, clipped, or hidden with ellipses.
- Long names should be solved with controlled type sizing, line breaks, or layout spacing while preserving the full name.
- Any AI card implementation must include an explicit long-name fitting strategy before it is accepted.
- Do not use truncation classes, ellipses, hidden overflow as the name-fitting solution, or fixed single-size name text that can clip long names.
- Keep the lower name zone readable against any artwork or background.
- If a horizontal separator line is used between first and last name, it must be placed as its own element exactly between the two text rows, visually bisecting the open space between them.
- Do not place high-detail texture, bright glare, or busy shapes directly behind critical text.
- Preserve a vertical trading-card silhouette with strong top, middle, and bottom reads.
- Use one consistent visual language across tiers; tier identity changes through material and intensity, not a totally different design style.

## Full-Art Player Rules

- Player face, pose, and jersey silhouette must be readable at small size.
- Player likeness should be based on a real reference image whenever the card is for a real player.
- Real-player cards should preserve recognizable facial structure, hair, facial hair, build, and era/team context from the reference.
- Jerseys must match the player's real-life team uniform direction for that card: correct base color, trim colors, visible team wordmark when applicable, and correct jersey number.
- Do not accept generic, invented, or wrong-team uniforms for real-player cards.
- Avoid fake typography, fake logos, and watermarks inside the generated image.
- If exact jersey text or logo fidelity matters and the generator cannot produce it reliably, use a deterministic card-layer overlay or a real-photo/source-assisted workflow rather than accepting distorted AI text.
- Prefer artwork with clean subject separation, strong rim light, and controlled background energy.
- Player image should feel integrated with the card world, not pasted over a disconnected poster.
- If the full-art image fights the OVR, name, or badges, simplify the card layer or regenerate the art.

## Tier Background Rules

Tier backgrounds are background-only studies. They should be useful before any player image is placed on top.

- Backgrounds should communicate the tier material clearly even without a player.
- Leave usable space for future OVR, player figure, team identity, name, and badges.
- Crystal/facet work should add premium texture without making the card unreadable.
- Uploaded or pasted background images can override placeholders, but they should follow the same readability rules.

## Tier Material Language

Emerald:
- Green crystal, fresh premium energy, cleanest and calmest tier.
- Should feel polished but not cosmic or overloaded.

Sapphire:
- Blue crystal, cooler light, sharper reflections, more depth than Emerald.
- Should feel sturdy, refined, and slightly more dramatic.

Ruby:
- Red crystal, heat, impact, stronger contrast.
- Avoid washing the whole card in red if it hurts legibility or skin tones.

Amethyst:
- Purple crystal/geode energy, rare-card atmosphere, richer light.
- Can use stronger glow and deeper shadows while preserving clarity.

Galaxy:
- Highest spectacle tier.
- Use prismatic, opal, cosmic-crystal, or starfield accents.
- Must still preserve the player, OVR, and name reads.

## Readability Checks

Before accepting an AI card direction, check:

- Full preview card.
- One-card-per-tier comparison.
- Compact-size preview.
- Mobile/card-grid preview.
- Long player names.
- Known long-name cases, including `Victor Wembanyama`, must visibly show every letter before a design is accepted.
- Top-left overall and natural-position stack.
- Bright and dark generated art.
- Background-only tier cards with OVR visible.

If the design only works at large size, it is not ready.

## Editing Rules

- Keep AI Art Card Lab changes scoped to `CardLabAiArtCards.tsx` and `card-art-system` docs unless the task explicitly asks for integration.
- Do not change player ratings, gameplay logic, Rogue mode, battle systems, or existing Card Lab tier previews for AI card experiments.
- Prefer small, reversible additions over broad rewrites.
- When experimenting, preserve the current working version unless the user asks to replace it.
- Run a build check after meaningful component changes.

## Prompt Guardrails

Prompts should ask for:

- Vertical premium basketball trading card composition.
- Real-player likeness from a clear reference image when available.
- Accurate real-life team jersey colors, wordmark, and jersey number for real-player cards.
- No fake text, fake logos, or watermarks in the generated image.
- Clear face and jersey silhouette.
- Tier-specific mineral/crystal material language.
- Open space in the top-left for overall rating and natural positions.
- Open space for the full player first and last name on the card face.
- Controlled background energy that supports the player.

Prompts should avoid:

- Fake typography.
- Overcrowded effects.
- Blurry faces.
- Cropped heads or unreadable bodies.
- Busy texture behind card text zones.
- Style changes that make tiers feel like separate products.
