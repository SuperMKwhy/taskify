---
name: Taskify
description: A spatial task board where tasks float as frosted-glass tiles over two pools of light.
colors:
  ink-ground: "oklch(0.15 0.03 275)"
  fg: "oklch(0.96 0.01 275)"
  fg-muted: "oklch(0.78 0.025 275)"
  fg-subtle: "oklch(0.64 0.03 275)"
  pool-pending: "oklch(0.72 0.17 45)"
  pool-pending-deep: "oklch(0.66 0.2 10)"
  pool-finished: "oklch(0.76 0.13 175)"
  pool-finished-deep: "oklch(0.68 0.14 220)"
  glass-fill: "oklch(1 0 0 / 0.08)"
  glass-fill-strong: "oklch(1 0 0 / 0.12)"
  glass-edge: "oklch(1 0 0 / 0.14)"
  glass-edge-top: "oklch(1 0 0 / 0.32)"
  accent: "oklch(0.82 0.12 175)"
  danger: "oklch(0.72 0.17 18)"
  warning: "oklch(0.83 0.14 75)"
  success: "oklch(0.8 0.14 165)"
typography:
  zone-label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "52px"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "0.22em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  chip:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.33
    fontFeature: "\"tnum\""
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  card: "20px"
  sheet: "28px"
  bounds: "32px"
  pill: "9999px"
spacing:
  1: "4px"
  1.5: "6px"
  2: "8px"
  2.5: "10px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.ink-ground}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "#ffffff"
  button-new-task:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.ink-ground}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.fg}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    textColor: "{colors.fg-muted}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  button-danger:
    textColor: "{colors.danger}"
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "40px"
  input-field:
    textColor: "{colors.fg}"
    rounded: "{rounded.xl}"
    padding: "0 14px"
    height: "44px"
  task-card:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.fg}"
    typography: "{typography.card-title}"
    rounded: "{rounded.card}"
    padding: "16px"
    width: "256px"
  chrome-pill:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.fg-muted}"
    rounded: "{rounded.pill}"
    height: "48px"
  dialog-sheet:
    textColor: "{colors.fg}"
    rounded: "{rounded.sheet}"
    padding: "24px"
    width: "448px"
  chip-project:
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  chip-due-overdue:
    textColor: "oklch(0.86 0.1 18)"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  chip-due-today:
    textColor: "oklch(0.9 0.11 75)"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
---

# Design System: Taskify

## Overview

**Creative North Star: "Glass Over Light"**

Taskify is a dark, pannable field of deep indigo ink with a faint dot grid. Two large radial pools of light live in world space on it: a warm amber-coral pool for Pending and a cool teal-mint pool for Finished. Every task is a frosted-glass tile floating over that field. The glass is the mechanism, not decoration. A card has no colour of its own; it takes its tint from whichever light it sits over, so completing a task and watching it drift from warm light into cool light is the system's signature move.

Chrome stays out of the way. The wordmark bar, account pill, zoom cluster and zone handles are all glass pills pinned to the corners. The only solid, opaque object on the board is the luminous "New task" pill, so the main action never reads as one more card. Density is calm: 256px cards, 16px padding, small 12–15px Geist type, generous negative space between pools.

Motion is soft and physical. Cards bob slowly on individual idle loops, settle under a force simulation, and dialogs and menus arrive on springs. Transitions that are not springs use one exponential ease-out. All of it collapses under `prefers-reduced-motion`.

**Key Characteristics:**
- Ink ground (never pure black), so the light pools read as light.
- Translucent glass with backdrop blur and saturation boost on every surface. The tint comes from the light behind it.
- Warm = pending, cool = finished. Hue carries state across the whole board.
- One opaque, luminous primary action per view.
- Pills and soft rounded rectangles; no sharp corners.
- Springs and exponential ease-out, fully reduced-motion aware.

## Colors

A near-monochrome indigo-ink world. The warm and cool light pools carry the colour, and small, low-alpha urgency and project tints sit on the glass.

### Primary
- **Pending Ember** (`pool-pending`, with `pool-pending-deep` at the falloff): the warm light pool behind the Pending zone, drawn as a 1300px radial gradient (42% alpha core, 20% at 45%, then transparent). It also appears as the dot on the Pending zone handle and as the warm half of the avatar gradient.
- **Finished Lagoon** (`pool-finished`, with `pool-finished-deep` at the falloff): the cool light pool behind Finished (36% core, 18% at 45%). It is the destination a completed card drifts toward.

### Secondary
- **Mint Signal** (`accent`): focus outlines (2px, 2px offset), the input focus border and its 3px halo at 18%, text caret, selection (35%), toast action text, and the active "New project" chip. It is a cool-side colour on purpose, because it is the board's interactive voice.

### Tertiary (status)
- **Rose Alarm** (`danger`): overdue chips, error alerts, invalid field borders, destructive hover. Chip text is lifted to `oklch(0.86 0.1 18)` for legibility.
- **Amber Hour** (`warning`): due-today and due-soon chips and the "due today" count dot. Chip text is `oklch(0.9 0.11 75)`.
- **Tick Green** (`success`): the filled completion checkbox only.

### Neutral
- **Indigo Ink** (`ink-ground`): page and canvas ground. A two-glow vignette (`oklch(0.3 0.08 285 / 0.55)` top-left, `oklch(0.28 0.07 230 / 0.5)` bottom-right) and a white 7–10% dot grid sit on top of it.
- **Starlight** (`fg`): primary text, and the fill of the primary action.
- **Haze** (`fg-muted`): secondary text, labels, inactive controls.
- **Dust** (`fg-subtle`): placeholders, hints, counts, tertiary icons.
- **Glass fill / edge** (`glass-fill`, `glass-fill-strong`, `glass-edge`, `glass-edge-top`): white at 8–12% fill, a 14% hairline, and a 32% top edge that catches the light.

### Named Rules
**The Light Is the Colour Rule.** Surfaces carry no hue of their own. Warmth and coolness come only from the Pending and Finished pools beneath the glass. Never give a card or panel a tinted fill to fake it.

**The Hue Wheel Rule.** Project identity is an oklch hue from a fixed set (250, 300, 145, 85, 200, 335, 25), hashed from the project name, rendered on fixed L/C steps: dot `oklch(0.8 0.15 h)`, chip text `oklch(0.9 0.07 h)`, chip fill `oklch(0.7 0.12 h / 0.16)` (0.24 when selected), ring `oklch(0.78 0.12 h / 0.32)` (`0.8 0.13 h / 0.6` when selected). Only the hue varies. The set avoids the pool hues so a project never reads as a zone.

**The Rose-and-Amber Rule.** Due urgency uses exactly two hues. Rose (18) means overdue. Amber (75) means today (22% fill, 45% ring) and, at lower intensity, due within two days (14% fill, 30% ring). Every other due date is a neutral white-5% chip. No third urgency colour.

## Typography

**Display Font:** none (no separate display face)
**Body Font:** Geist (via `next/font`, with system sans fallback), with stylistic sets `ss01` and `cv11` on the body
**Label/Mono Font:** Geist Mono is loaded but is not part of the public surface

**Character:** One quiet, technical sans throughout. Hierarchy comes from weight (300 / 500 / 600) and size, never from a second family. Counts and dates use tabular numerals.

### Hierarchy
- **Zone label** (300, 52px, line-height 1, 0.22em tracking, uppercase, 18% alpha tint of its pool): the giant world-space "PENDING" / "FINISHED" words behind the cards. It names a zone and sits in the scene. It is not a kicker.
- **Headline** (600, 24px, -0.02em): auth card titles.
- **Title** (600, 18–20px, -0.01em): dialog, empty-state and error titles.
- **Card title** (600, 15px, leading-snug): task titles. Completed titles drop to `fg-muted` with a white-40% strikethrough.
- **Body** (400, 15px, leading-relaxed): subtitles, empty-state copy, inputs. Card descriptions use 13px clamped to 3 lines.
- **Label** (500, 13px): field labels, header counts, project picker chips.
- **Chip** (500, 12px, tabular): project and due chips, zone handles, hints. Kbd keys are 11px.
- **Wordmark** (600, 17px, -0.01em).

### Named Rules
**The Weight Not Face Rule.** All hierarchy is Geist weight and size. Do not introduce a display face or a mono label style on public surfaces.

## Layout

A full-bleed, infinite-feeling canvas (`100dvh`, overflow hidden) with a camera transform (translate + scale, `transform-origin: 0 0`). Programmatic camera moves animate over 420ms on the exponential ease-out. Zones, pools, cards and the board-bounds outline (a dashed white-10% rectangle with 32px radius and a glass resize handle) all live in world space. Chrome lives in screen space and is pinned to the four corners at 16px inset (24px from `sm` up): wordmark and counts top-left, account top-right, zoom cluster and Fit board bottom-left, New task bottom-right. Toasts stack bottom-centre, three at most. The task dialog is a bottom sheet under `sm` (top corners 28px, safe-area padding) and a centred 448px card from `sm` up. Auth pages centre a 400px glass card over the same ink, pools and grid, with illustrative drifting sample cards shown from `lg` up.

Spacing follows the Tailwind 4px step: 6/8/10px inside chips and rows, 16px card padding and form gaps, 24px dialog padding and section breaks, 32px on large auth cards.

## Elevation & Depth

Depth is glass layered over light. Every raised surface is translucent, blurred (18px for standard glass, 28px for overlay glass) and saturated (160–170%), so the pools glow through it. Soft, indigo-tinted, negatively spread shadows lift the glass off the ground. A 1px top-edge highlight and a faint inset top line make each pane look lit from above. Nothing is lifted by a hard or offset-black shadow.

### Shadow Vocabulary
- **Glass rest** (`0 10px 30px -12px oklch(0.08 0.04 275 / 0.7), 0 2px 6px -2px oklch(0.08 0.04 275 / 0.5)`): every glass pane at rest.
- **Glass lift** (`0 24px 50px -18px oklch(0.08 0.04 275 / 0.8), 0 4px 12px -4px oklch(0.08 0.04 275 / 0.55)`): overlay glass (dialogs, menus, toasts) and a card while dragged.
- **Luminous glow** (`0 14px 34px -12px oklch(0.85 0.08 175 / 0.65)` on the New task pill, `0 8px 24px -10px oklch(0.9 0.05 175 / 0.6)` on primary buttons): a mint-tinted halo that only the opaque primary action carries.
- **Recessed field** (`inset 0 1px 2px oklch(0 0 0 / 0.25)`): inputs are sunk into the glass, not raised.

### Named Rules
**The Backdrop Root Rule.** Glass only works if its blur can see the light pools. No ancestor of a glass element may animate or set `opacity` < 1, `filter`, `mask` or `backdrop-filter`, because that would make the ancestor the backdrop root and cut the glass off from the board. Fade the glass element itself or a sibling scrim, never a wrapper. Hide the camera layer with `visibility`, never with opacity. Transforms are safe.

**The Never on Flat Rule.** Glass sits only over the ink-plus-pools field. Don't put a glass pane on a flat fill where the blur has nothing to refract.

## Shapes

Soft, continuous rounding at every size. Controls that sit freely on the board (chrome bars, zone handles, chips, the New task button, icon buttons, the checkbox) are full pills or circles. Contained rectangles step up in radius with size: 6px kbd, 8px small inline buttons, 12px buttons and inputs, 16px toasts and menus, 20px task cards, 28px dialogs and auth cards, 32px board bounds. Borders are 1px white hairlines at 10–15%, lighter (32%) on the top edge of glass. Dashed borders mean "add" or "extent" (New project chip, board bounds).

## Components

### Buttons
Calm and tactile. They press in rather than bounce.
- **Shape:** gently rounded rectangle (12px), 40px tall (44px on auth forms), 600 weight at 14px.
- **Primary:** solid Starlight fill with Ink text and a mint glow. Hover goes to pure white. Disabled drops to 60%. Use one per view: Add task, Save changes, Log in, Try again.
- **New task (signature):** the board's primary action is a 48px solid Starlight pill with a plus icon and an inset "N" key hint (from `sm` up), pinned bottom-right. It is the only opaque control on the board.
- **Hover / Focus / Active:** 150ms colour transitions and `scale(0.98)` on press (0.97 for the pill). Focus shows the global 2px mint outline at 2px offset.
- **Secondary:** standard glass with `fg` text, brightening to white 15% on hover.
- **Ghost:** no fill, `fg-muted` text, white 10% hover.
- **Danger:** rose text, rose 15% hover. Never filled.

### Chips
- **Project chip:** pill, 12px/500, a 6px hue dot, then the Hue Wheel fill, text and 1px ring.
- **Due chip:** pill, 12px/500 tabular, 1px ring, with the Rose-and-Amber states. Labels are human: "Today", "Tomorrow", "2d overdue", "Aug 25".
- **Picker chips (dialog):** 32px pill radios. Unselected is `fg-muted` with a white 12% ring. Selected takes the project hue (24% fill, 60% ring). "New project" is dashed and turns mint when active. Quick-date chips use white 15% when active.

### Cards / Containers
- **Task card:** 256px wide, 20px radius, 16px padding, standard glass. Header row: project chip on the left, due chip and hover-revealed edit/delete icon buttons on the right (always visible on touch, reachable by Tab). Body: a 20px circular checkbox (white 35% ring, filling Tick Green when done) beside the title, then an optional description. Completed cards fade to 62% opacity on the element itself.
- **Card motion:** enters from `scale 0.9, opacity 0` on a spring (stiffness 300, damping 26), scales to 1.04 and takes the lift shadow while dragged, and idles on a per-card bob (3–6px over 4.5–7.5s). The bob stops under reduced motion and while dragging.
- **Overlay glass (dialog, menu, toast, empty/error states, auth card):** denser ink-tinted glass (`oklch(0.3 0.04 275 / 0.72)` to `oklch(0.22 0.035 275 / 0.78)`), 28px blur, lift shadow. Radius 28px for sheets and 16px for menus and toasts.

### Inputs / Fields
- **Style:** a recessed well inside the glass. Ink at 45% fill, white 10% hairline, inset shadow, 12px radius, 44px tall, 15px text, mint caret. The label sits above (13px/500 `fg-muted`), with an "Optional" marker on the right in `fg-subtle`.
- **Focus:** the border goes mint at 70%, the well darkens to 60%, and a 3px mint halo at 18% appears, over 160ms on the exponential ease-out.
- **Error / Disabled:** `aria-invalid` turns the border rose at 70% and the message below turns rose. Form-level errors use the Alert: a rose 12% fill and 35% border, 12px radius, with a circle-i icon. Disabled is 60% opacity.

### Navigation
- **Board chrome:** glass pills, 40–48px tall, in the corners. The header pill holds the wordmark, a hairline divider and live counts: the pending count, a rose dot with the overdue count, and an amber dot with the due-today count (from `md` up).
- **Account:** a glass pill with an avatar circle filled by a warm-to-cool pool gradient and ink initial. It opens an overlay-glass menu on a spring (420/32) from the top-right.
- **Zoom cluster:** a glass pill group of 32px circular icon buttons around a tabular percentage, plus a separate "Fit board" glass pill.

### Zone (signature)
Each zone is a 1300px light pool, a giant faint uppercase zone label 64px above centre, and a glass grab-handle pill at the exact attractor point. The handle shows a pool-coloured dot, the zone name and a tabular count, sits above cards (z 100), and scales to 1.05 while dragged.

### Toast
Overlay glass, 16px radius, 14px text. It slides up 16px on a spring (380/32) and leaves in 180ms. Errors carry a rose circle-i icon. An optional mint text action ("Undo") and a dismiss X sit on the right. It auto-dismisses after 4s, and at most three are stacked.

## Do's and Don'ts

### Do:
- **Do** keep every surface translucent glass over the ink-and-pools field, and let the pools supply all warmth and coolness.
- **Do** reserve the solid Starlight fill for the single primary action in a view. On the board, that is the New task pill.
- **Do** derive project colour only from the fixed hue set on the fixed L/C steps (dot 0.8/0.15, text 0.9/0.07, fill 0.7/0.12 at 16%).
- **Do** signal due urgency with rose (overdue) and amber (today, then within two days) chips, and nothing else.
- **Do** animate entrances and drags with springs (stiffness 300–420, damping 26–32) and everything else with `cubic-bezier(0.16, 1, 0.3, 1)`, 150–600ms.
- **Do** honour `prefers-reduced-motion`. The global rule collapses CSS animation and transition, and idle bobbing and drifting sample cards must check `useReducedMotion`.
- **Do** fade glass by animating the glass element itself or a sibling scrim.

### Don't:
- **Don't** animate `opacity` or `filter` (or set `mask` or `backdrop-filter`) on any ancestor of a glass element. It breaks the backdrop and the glass goes grey.
- **Don't** use pure black for the ground, or a flat fill behind glass.
- **Don't** give a card or panel its own tinted fill to show its zone or state.
- **Don't** add a second opaque control to the board chrome, or fill secondary, ghost or danger buttons.
- **Don't** add a third urgency colour or use the pool hues for projects.
- **Don't** use hard, offset or pure-black shadows. Shadows are soft, negatively spread and indigo-tinted.
- **Don't** introduce a display face or mono labels on public surfaces.
