---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/login/page.tsx","app/signup/page.tsx"]
---

# Board surface (/, /login, /signup)

Mode: Operate. Audience: public sign-ups managing personal tasks. Job: glance at what's pending/overdue, add, complete, delete. Aesthetic pinned by the user: glassmorphism. Code-led build.

## Direction contract

THESIS: Tasks are frosted-glass tiles drifting over two pools of light. Glass is the mechanism, not decoration: a card's tint comes from whatever light it floats over. Refuses the category default of a grey grid with grey cards.

OWN-WORLD: Deep indigo-ink ground (oklch ~0.17 0.03 275) with a faint dot grid. Pending zone is a warm amber-coral light pool, Finished a cool teal-mint pool, both living in world space. Glass: white 7–12% fill, backdrop blur 18px + saturate, 1px top-lit hairline, soft offset shadow. Project hue appears as a dot + tinted chip. Geist UI type; zone names large, light, tracked.

STORY: The visitor sees their tasks floating, knows what's overdue by its rose chip, adds with N or the + button, ticks a card and watches it drift from warm light into cool light.

FIRST VIEWPORT: Full-bleed canvas. Top-left glass bar: wordmark + pending/overdue counts. Top-right: account pill. Bottom-left: zoom cluster + Fit board. Bottom-right: primary "New task" as a solid luminous pill (Operate primary-action emphasis: the one opaque element on the board, so the main action never reads as just another card). Under 640px the camera frames the Pending cluster; Finished is one pan or Fit board away. Cards cluster around the Pending pool left, Finished right.

FORM: User-pinned glassmorphism (no roll), translated through Operate rules: standard controls, world lends type, palette, density, and the signature move: completing a task carries it across the light field. seed: none (roll skipped: direction pinned by the user; `concept-seed --check-seed none` confirms this machine could roll)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
