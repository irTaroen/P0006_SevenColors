# Kairos Design System

> A neumorphic design language with soft cloud-blue branding for the Nimbus · Kairos workforce dashboard.
> This document is the single source of truth for visual decisions. When in doubt, follow this.

---

## Philosophy

Kairos has a **warm, calm, hand-crafted** aesthetic — the opposite of the typical cold enterprise dashboard. Every surface should feel like it could be **touched**: pressed in, lifted up, depressed. Color is reserved for *signal*, never decoration. The interface should feel approachable enough that HR and supervisors enjoy spending time in it.

**Three principles drive every choice:**

1. **Depth, not borders.** Elements separate from each other through soft paired shadows, not lines. The same surface color flows everywhere — only the lighting direction changes.
2. **Color = signal.** The warm cream base is the canvas. Each color in the palette means something specific. Never use color decoratively.
3. **Soft over sharp.** Rounded corners, gentle transitions, pastel fills, hand-drawn illustration. Nothing is harsh. Nothing pops aggressively.

The system supports a **light theme** (warm cream surface, slate-blue text) and a **dark theme** (deep warm-purple-black surface, light-lavender text, ambient cosmic glow). They are sibling identities, not inverses — both share the same warmth, depth language, and semantic palette structure. Components read every value from CSS variables; they never branch on theme.

---

## Design Tokens

Kairos supports **light** and **dark** themes. Tokens are defined as CSS custom properties on `:root` with a dark override via `[data-theme="dark"]`. The theme is set on a wrapper element (e.g. `<html data-theme="light">`), letting all variables cascade.

The whole token set is duplicated between the two themes. Use the **same variable names** in your components — never branch by theme inside a component.

```css
:root {
  /* Surface */
  --color-bg: #f5f0eb;          /* warm cream canvas */
  --color-shade: #c9c2b8;       /* warm-grey shadow side */
  --color-highlight: #ffffff;   /* pure white highlight side */
  --color-divider: #d9d2c8;

  /* Text */
  --color-text-primary:   #31344b;  /* deep slate-blue */
  --color-text-secondary: #6b6f8e;
  --color-text-tertiary:  #9a9db4;  /* em-dashes, placeholders */

  /* Brand — cloud-blue accent */
  --color-cloud-light: #cfe8f5;
  --color-cloud-mid:   #a5d3ec;
  --color-cloud-deep:  #5fa8d3;

  /* Ambient background — none in light */
  --bg-ambient: none;
}

[data-theme="dark"] {
  /* Surface — deep warm-purple-black, the "lights off" version of the cream */
  --color-bg: #1a1626;
  --color-shade: #0f0c18;       /* darker than base */
  --color-highlight: #2a2438;   /* lighter than base */
  --color-divider: #2f2940;

  /* Text */
  --color-text-primary:   #e8e4f0;
  --color-text-secondary: #a8a2bc;
  --color-text-tertiary:  #6c6580;

  /* Brand shifts brighter to glow against dark */
  --color-cloud-light: #7ac4e8;
  --color-cloud-mid:   #5fa8d3;
  --color-cloud-deep:  #a5d8f0;

  /* Ambient cosmic glow — see Dark Mode section below */
  --bg-ambient:
    radial-gradient(ellipse at 20% 10%, rgba(139, 92, 246, 0.12), transparent 50%),
    radial-gradient(ellipse at 80% 90%, rgba(245, 158, 79, 0.08), transparent 50%),
    radial-gradient(ellipse at 60% 50%, rgba(245, 215, 110, 0.05), transparent 60%);
}
```

Apply the ambient gradient on the page root:

```css
body {
  background: var(--color-bg) var(--bg-ambient) fixed;
  color: var(--color-text-primary);
  transition: background 0.4s ease, color 0.4s ease;
}
```

Never use pure black (`#000`) or pure white (`#fff`) for content — always one of the slate-blue or warm-cream tones from the palette. The neumorphic shadows are the only place pure white appears, and only as a highlight color.

### Semantic palette

Each semantic color comes as a paired `fg/bg`. `fg` for text, icons, and dots. `bg` for soft tinted fills (badge backgrounds, KPI icon wells).

In **light mode** the colors are muted, warm-balanced to sit on cream. In **dark mode** the foregrounds shift brighter/more saturated so they glow against the dark surface, and the backgrounds become deep, tinted versions of their hue (so the inset wells still feel like depressions, not bright stickers).

```css
:root {
  /* Amber — "incomplete" states */
  --color-amber-fg: #b87333;
  --color-amber-bg: #f0d9b8;

  /* Red — "not approved" / errors */
  --color-red-fg: #b04545;
  --color-red-bg: #f0c8c8;

  /* Purple — payroll signals */
  --color-purple-fg: #7a5fb3;
  --color-purple-bg: #d8cfeb;

  /* Orange — over-capacity (light mode) */
  --color-orange-fg: #c4763a;
  --color-orange-bg: #f2d5b8;

  /* Cyan */
  --color-cyan-fg: #4a8fa8;
  --color-cyan-bg: #c8e0e8;

  /* Green — "all clear" */
  --color-green-fg: #5a8a4a;
  --color-green-bg: #d2e2c0;

  /* Grey — capacity flags (neutral severity) */
  --color-grey-fg: #6b6f7e;
  --color-grey-bg: #dcdbd4;

  /* Yellow — double-bookings */
  --color-yellow-fg: #a38a2a;
  --color-yellow-bg: #ece1b8;
}

[data-theme="dark"] {
  --color-amber-fg:  #f5a04f;  --color-amber-bg:  #3a2818;
  --color-red-fg:    #e87878;  --color-red-bg:    #3a1f1f;
  --color-purple-fg: #b794f6;  --color-purple-bg: #2e2348;
  --color-orange-fg: #f59e4f;  --color-orange-bg: #3a2614;
  --color-cyan-fg:   #7ac4e0;  --color-cyan-bg:   #1a2c32;
  --color-green-fg:  #9bcf85;  --color-green-bg:  #1f2e1a;
  --color-grey-fg:   #9d9db4;  --color-grey-bg:   #28253a;
  --color-yellow-fg: #f5d76e;  --color-yellow-bg: #352c14;
}
```

### Capacity-bar pastels

These three pastels are reserved exclusively for the capacity-bar fill. They are NOT general-purpose colors — they're tied to one component's semantic states. They look great on both light and dark surfaces, so the values **don't change between themes**:

```css
:root {
  --color-capacity-under: #FFB38E;  /* under-worked: orange */
  --color-capacity-exact: #C7EABB;  /* perfect match: green */
  --color-capacity-over:  #BFECFF;  /* over-worked: blue */
}
```

### Brand-color use rules

**Use cloud-blue for:**
- Active filter states (the pip in the corner of a pressed KPI card)
- Filter input focus rings
- Hover tint on interactive elements (text/icons shift to `--color-cloud-deep` on hover)
- Brand moments — logo, signature touches, ambient glow gradients in dark mode

**Never use cloud-blue for:**
- Error / warning / alert states (those have dedicated semantic colors)
- Decorative gradients or backgrounds on light surfaces
- Body text or primary data

The cloud-blue is the *only* color in the system that the brand "owns" — every other color is semantic. Keep it sacred.

### Typography

```css
@theme {
  --font-sans: "Poppins", system-ui, sans-serif;
}
```

Import in your layout's `<head>`:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap">
```

**Type scale:**

| Use | Size | Weight | Letter-spacing |
|---|---|---|---|
| Page title (`h1`) | 22px | 600 | -0.5px |
| KPI value | 28px | 600 | -0.5px |
| Section title | 16px | 700 | — |
| Body / cell data | 13px | 500 | — |
| Secondary cell text | 12px | 400 | — |
| Labels / KPI captions | 11.5px | 400 | — |
| Column headers (uppercase) | 10px | 500 | 0.5px |
| Mini chips / badges | 10–11px | 600 | — |

**Numeric data must use tabular figures.** Always apply `font-variant-numeric: tabular-nums` to columns of numbers so digits align vertically.

### Border radii

```css
@theme {
  --radius-pill:   9999px;  /* pills, badges, status indicators */
  --radius-sm:     8px;     /* small controls */
  --radius-md:     12px;    /* nested wells */
  --radius-lg:     16px;    /* row cards */
  --radius-xl:     20px;    /* KPI cards */
  --radius-2xl:    22px;    /* large panels (the table) */
}
```

### Spacing

Use Tailwind's default spacing scale. Common values for Kairos:
- `gap-2` (8px), `gap-3` (12px), `gap-4` (16px) — between siblings
- `p-4` (16px), `p-5` (20px), `p-6` (24px) — card interior padding
- `px-9` (36px) — main page horizontal padding

---

## Neumorphic shadow primitives

These are the **most important** part of the system. Every interactive surface uses one of these shadows. They reference the highlight/shade tokens so they swap automatically with the theme.

```css
:root {
  /* Raised — element protrudes outward */
  --shadow-raised:     -6px -6px 12px var(--color-highlight),  6px  6px 12px var(--color-shade);
  --shadow-raised-sm:  -4px -4px  8px var(--color-highlight),  4px  4px  8px var(--color-shade);
  --shadow-raised-xs:  -2px -2px  4px var(--color-highlight),  2px  2px  4px var(--color-shade);

  /* Lifted — bigger, softer raised state for hover */
  --shadow-lifted:     -8px -8px 16px var(--color-highlight),  8px  8px 16px var(--color-shade);
  --shadow-lifted-sm:  -6px -6px 12px var(--color-highlight),  6px  6px 12px var(--color-shade);

  /* Inset — element pressed into the surface */
  --shadow-inset:      inset -4px -4px  8px var(--color-highlight), inset  4px  4px  8px var(--color-shade);
  --shadow-inset-sm:   inset -3px -3px  6px var(--color-highlight), inset  3px  3px  6px var(--color-shade);
}
```

Because `--color-highlight` and `--color-shade` are theme-aware, **the shadows automatically adapt** when the user switches modes. You never branch shadow definitions by theme.

**Mental model:**

- **Raised** = a button waiting to be clicked. Light from top-left.
- **Lifted** = the same button on hover, drifting up toward you. Same lighting, bigger shadows.
- **Inset** = a pressed button, an input field, a status badge tucked into a depression. Light still from top-left, but painted on the inside walls.

**The colors don't change** between these three states — only the shadow definition does. This is what makes neumorphism feel physical: lighting cues do the work that color usually does.

### Why neumorphism works in dark mode

In light mode, neumorphism relies on a clear high-contrast pair (white highlight vs grey shadow on cream). In dark mode you can't go "darker than black" for shadows. The trick: pick a mid-dark base, with a slightly lighter highlight and a deeper shadow:

| Token | Light | Dark |
|---|---|---|
| `--color-bg` (base) | `#f5f0eb` | `#1a1626` |
| `--color-highlight` | `#ffffff` (lighter than bg) | `#2a2438` (lighter than bg) |
| `--color-shade` | `#c9c2b8` (darker than bg) | `#0f0c18` (darker than bg) |

The relative relationship — "highlight is lighter than the base, shade is darker than the base" — is what matters, not the absolute values. As long as that relationship holds, the same neumorphic shadow recipe works in any color scheme.

---

## Interaction patterns

### The three-state button

Every interactive element follows the same pattern:

| State | Shadow | Transform | Color shift |
|---|---|---|---|
| Rest | `--shadow-raised-sm` | none | text: `--color-text-primary` |
| Hover | `--shadow-lifted-sm` | `translateY(-1px)` | text → `--color-cloud-deep` |
| Pressed / Active | `--shadow-inset-sm` | `translateY(0)` | text stays cloud-deep |

In Tailwind v4, register these as utilities:

```css
@layer utilities {
  .neu-button {
    background: var(--color-bg);
    box-shadow: var(--shadow-raised-sm);
    color: var(--color-text-primary);
    transition: box-shadow 0.2s ease, transform 0.15s ease, color 0.2s ease;
  }
  .neu-button:hover {
    box-shadow: var(--shadow-lifted-sm);
    transform: translateY(-1px);
    color: var(--color-cloud-deep);
  }
  .neu-button:active,
  .neu-button[data-active="true"] {
    box-shadow: var(--shadow-inset-sm);
    transform: translateY(0);
    color: var(--color-cloud-deep);
  }
}
```

Because every value resolves through a CSS variable, the button gets full theme support for free — no JS branching, no conditional classNames.

**Why two separate effects:** hover signals "this is clickable" (it lifts toward you), pressed signals "you clicked it" (it sinks in). Without the lift state, the only feedback is the inset, which makes hover and pressed indistinguishable.

**Transition timing matters:**
- `box-shadow`: 0.2s (slower, softer)
- `transform`: 0.15s (faster, snappier)
- `color`: 0.2s (matches shadow)

If you transition everything at the same speed, the press feels mushy. Snappier transform + softer shadow = real button feel.

### Inputs

Inputs are **always inset** at rest. Focus adds a soft cloud-blue glow ring layered on top of the existing shadow:

```css
.neu-input {
  background: var(--color-bg);
  box-shadow: var(--shadow-inset-sm);
  border: none;
  border-radius: var(--radius-pill);
  padding: 9px 14px 9px 32px;  /* extra left for icon */
  font-size: 12px;
  color: var(--color-text-primary);
  transition: box-shadow 0.2s ease;
}
.neu-input:focus {
  outline: none;
  box-shadow:
    var(--shadow-inset-sm),
    0 0 0 2px var(--color-cloud-light);
}
.neu-input::placeholder {
  color: var(--color-text-tertiary);
}
```

---

## Component recipes

### KPI card

The signature interactive element. Five of these sit in a row at the top of the dashboard.

**Structure:**
- Raised card with rounded `--radius-xl` corners
- Left side: inset icon well tinted with the card's semantic color
- Right side: large number (28px) above small wrapped label (11.5px)
- When active (filter applied): small cloud-blue pip in the top-right corner, card pressed inset

**Behavior:**
- Rest → `--shadow-raised`
- Hover → `--shadow-lifted`, `translateY(-2px)`, number turns cloud-deep, icon well scales `1.05`
- Active → `--shadow-inset`, `scale(0.99)`, pip appears in corner
- Click toggles a column filter on the table

**Critical layout detail:** when in a grid, use `repeat(5, minmax(0, 1fr))` not `repeat(5, 1fr)`. The `minmax(0, ...)` is what guarantees equal column widths regardless of label length. Apply `word-break: break-word` to the label so long text wraps within the card instead of stretching it.

### Capacity bar

Replaces three numeric columns (Rooster / Totaal / Verschil) with one visual:

- Caption row: `{worked} / {scheduled}h` on the left, `±diff` pill on the right
- Inset cream track (pressed-in well)
- Solid pastel fill inside the track, no glow, no gradient
- Three states based on `verschil`:
  - **< 0** (under): `--color-capacity-under` orange
  - **= 0** (exact): `--color-capacity-exact` green
  - **> 0** (over): `--color-capacity-over` blue

**Null-data state:** show em-dash, no bar at all. Empty bars read as bugs.

**Animation:** width transitions over 0.5s ease when data changes.

### Status badges (week level)

Pill-shaped, inset, labeled. Only render when a check **fails**.

Each badge:
- `border-radius: --radius-pill`
- Background = `--color-{semantic}-bg`
- Text = `--color-{semantic}-fg`
- Box-shadow = `--shadow-inset-sm`
- Small colored dot prefix (5×5px)
- Padding: `3px 9px`
- Font: 10.5px, weight 600

**Clean rows** (no failures) show a single subtle confirmation: a small inset green well with checkmark + text "Alles in orde". Never show 5 green checkmarks — it's noise.

### Mini badges (day level)

For day rows, the same color mapping but **color only, no text**. Render only failed checks.

- 14×14px outer inset circle
- 6×6px inner colored dot (`--color-{semantic}-fg`)
- Background = `--color-{semantic}-bg`
- `box-shadow: --shadow-inset-sm`
- `title` attribute for hover tooltip

**Why mini badges at day level:** the user has already seen full labels at the week level above. Day rows just need to show *which colors* fail on which days, so the eye can scan for patterns. Text would be redundant.

### Check column mapping

The current mapping between checks and colors. Keep these in lockstep across KPI cards, week badges, and day badges:

| Check key | Label | Color |
|---|---|---|
| `compleet` | "Niet compleet" | amber |
| `geaccordeerd` | "Niet geaccordeerd" | red |
| `payroll` | "Payroll" | purple |
| `capaciteit` | "Over capaciteit" | grey |
| `dubbel` | "Dubbele boeking" | yellow |

### Status pill (always-visible bar below KPIs)

An inset pill that sits below the KPI grid. Switches content based on filter state:

- **No filter active**: green dot + `611 medewerkers · 2.418 rijen · Geladen`
- **Filter active**: cloud-blue dot + `Gefilterd op: {label} · {n} resultaten` + "Wissen ✕" button on the right

Always visible — never appears or disappears. Only its contents transition.

### Table column alignment

The table has **four** grids that must all use the same column template:
1. Filter inputs row
2. Column headers row
3. Week rows
4. Day rows (10 columns — the chevron column is absent)

**Critical:** every `fr` column must be wrapped in `minmax(0, ...)`. Without this, content like long company names with `white-space: nowrap` will expand its column and push everything to its right out of alignment with the header above.

```css
grid-template-columns:
  20px
  minmax(0, 1.4fr)   /* Medewerker */
  minmax(0, 1.2fr)   /* Leidinggevende */
  minmax(0, 1.4fr)   /* Werkgever */
  minmax(0, 1.2fr)   /* Functie */
  minmax(0, 0.7fr)   /* Week */
  minmax(0, 2fr)     /* Capaciteit bar */
  minmax(0, 0.5fr)   /* Gewerkt */
  minmax(0, 0.5fr)   /* Verlof */
  minmax(0, 0.5fr)   /* Verzuim */
  minmax(0, 2.2fr)   /* Status */;
```

### Em-dash for null

Display `—` (em-dash, U+2014) for any `null` or `undefined` numeric value. Style it lighter than primary text:

```jsx
<span style={{ color: "var(--color-text-tertiary)", fontWeight: 300 }}>—</span>
```

This is consistent across the entire app. Never show `0` for missing data, never show "—" for actual zero.

---

## Animation

### Standard transitions

| What | Duration | Easing |
|---|---|---|
| Hover state changes | 0.15–0.2s | ease |
| Color shifts | 0.2s | ease |
| Width / size changes (bars) | 0.5s | ease |
| Row expand / collapse | 0.25s | ease |
| Day row stagger reveal | 30ms × index | ease |

### Day row reveal animation

When a week row is expanded, day rows fade and slide in with a 30ms stagger between them:

```css
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.day-row {
  animation: slideDown 0.25s ease both;
  /* animation-delay is set inline per-row: { animationDelay: `${j * 30}ms` } */
}
```

### Chevron rotation

```css
.chevron {
  transition: transform 0.2s ease;
}
.chevron[data-open="true"] {
  transform: rotate(90deg);
}
```

---

## Layout patterns

### Page structure

```
<Header>            — sticky/static, logo + period nav + actions
<KPISection>        — 5 cards in a 5-column grid
<StatusPill>        — always-visible inset pill below KPIs
<TablePanel>        — raised neumorphic card containing:
  ├ Filter row
  ├ Divider
  ├ Column headers
  └ Row cards (each is raised → inset when expanded)
<Footer>            — version number, tiny tertiary text
```

### Page padding

- Main content: `24px` top, `36px` left/right, `36px` bottom (mobile reduces left/right)
- Table panel internal: `24px` left/right on headers and filter row, matching effective left position on week rows via `outer wrapper 16px + inner row 8px = 24px`
- Day rows align: outer wrapper + `38px` left = same x-position as Medewerker column in the week row above

---

## Brand assets

### Logo

The Kairos icon is a **hand-drawn cloud illustration** — soft sky-blue (`#cfe8f5`) and white clouds with a deep charcoal outline (`#2a2a2a`). Lines should have organic, slightly imperfect weight (~1.8–2px stroke). The vibe is friendly and approachable, never corporate.

When placed in the header, the logo sits inside a raised neumorphic plate (`width: 56px`, `border-radius: 18px`, `--shadow-raised`).

### Sub-brand label

Above the page title, render a small uppercase label:

```
NIMBUS · KAIROS
```

- Font: 11px Poppins, weight 500
- Color: `--color-text-tertiary`
- Letter-spacing: 0.5px
- Text-transform: uppercase

---

## Dark mode

Kairos has a fully designed dark theme inspired by the warm-cosmic feeling of a deep-purple night sky. It's not a mechanical inversion of the light theme — it's a sibling identity. The same warmth that makes the cream-mode feel approachable carries through to dark mode via the purple-toned base instead of a cold blue-black.

### Setting the active theme

Use `next-themes` (or any equivalent) to set `data-theme="light"` or `data-theme="dark"` on the `<html>` element. All component CSS reads from CSS variables and adapts automatically — components themselves contain **zero theme logic**.

```jsx
// providers/index.tsx (already exists)
import { ThemeProvider } from "next-themes";

export function AppProviders({ children }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

The toggle button uses `resolvedTheme` (not `theme`) to avoid the literal `"system"` value, then calls `setTheme("dark")` / `setTheme("light")`. The button itself follows the standard three-state neu-button pattern.

### Cosmic ambience (dark mode only)

Dark mode gets two layered background effects that evoke a starfield without distracting from data:

**1. Ambient gradient blobs** — soft radial gradients in purple, orange, and yellow placed at corners and center. These come from the `--bg-ambient` token (defined as `none` in light, populated in dark). Apply once to `body`:

```css
body {
  background: var(--color-bg) var(--bg-ambient) fixed;
}
```

**2. Starfield** — a layer of tiny `radial-gradient` dots scattered across a `position: fixed` div that sits behind all content. Rendered only when `[data-theme="dark"]`:

```css
[data-theme="dark"] .starfield {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 0;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(245,215,110,0.5), transparent),
    radial-gradient(1px 1px at 70% 60%, rgba(183,148,246,0.4), transparent),
    radial-gradient(1.5px 1.5px at 45% 80%, rgba(245,158,79,0.5), transparent),
    radial-gradient(1px 1px at 85% 15%, rgba(122,196,232,0.4), transparent),
    radial-gradient(1px 1px at 15% 75%, rgba(245,215,110,0.3), transparent),
    radial-gradient(1.5px 1.5px at 60% 25%, rgba(245,160,79,0.4), transparent),
    radial-gradient(1px 1px at 90% 85%, rgba(183,148,246,0.5), transparent),
    radial-gradient(1px 1px at 30% 90%, rgba(122,196,232,0.3), transparent),
    radial-gradient(2px 2px at 75% 45%, rgba(245,215,110,0.4), transparent),
    radial-gradient(1px 1px at 5% 50%, rgba(255,255,255,0.4), transparent);
}
[data-theme="light"] .starfield { display: none; }
```

Render `<div class="starfield" />` once in the root layout and wrap your content in a `position: relative; z-index: 1` container so it sits above the stars.

Keep starfield density restrained — ten dots, varied colors, varied sizes. Too many starts to feel like a screensaver instead of an ambient texture.

### Theme transition

Apply a `0.4s ease` transition to `background` and `color` on `body` so theme switches are smooth, not jarring:

```css
body {
  transition: background 0.4s ease, color 0.4s ease;
}
```

Individual components inherit their own micro-transitions (0.2s ease on shadows, 0.15s on transforms). They will recalculate softly during a theme swap without any extra work.

### Designing components for both themes

The rule is simple: **components reference CSS variables only**. They never read `theme` state, never apply `[data-theme]`-specific styles, never branch by mode in JSX. If a component looks wrong in one theme, the fix belongs in the token layer, not the component.

A few specific things to keep in mind when building new components:

- **Backgrounds are always `var(--color-bg)`** — never a literal hex. The whole point of the system is that the same surface flows through both themes.
- **Brand SVGs (the cloud logo)** keep a fixed dark stroke color regardless of theme — the hand-drawn outline is part of the brand mark. Use a hardcoded `#2a2438` for the cloud outline stroke. Cloud-fill colors come from the cloud-blue tokens (which DO swap with theme).
- **Inset chip backgrounds** in dark mode look right only when their tinted color is *darker* than the page bg, so the chip feels pressed in. The `--color-{semantic}-bg` values in `[data-theme="dark"]` are tuned for this — never override them locally.
- **Don't reach for shadow modifications** to make something look better in dark mode. If a shadow feels wrong, it's almost always because the `--color-highlight` / `--color-shade` relationship is off, not the shadow recipe.

### What doesn't change between themes

- All semantic *meaning* — amber still means "incomplete", red still means "not approved", etc.
- The neumorphic shadow recipe (just the values inside it adapt)
- Layout, spacing, type scale, radii
- Animation timings
- Capacity-bar pastels (`#FFB38E`, `#C7EABB`, `#BFECFF` work on both)

### What changes between themes

- The base surface (`bg`, `shade`, `highlight`, `divider`)
- Text colors (slate-blue family → light-lavender family)
- Cloud-blue brand (medium-saturation → brighter, more luminous)
- Semantic palette tones (muted-warm → brighter-saturated with darker bg tints)
- Ambient background (none → cosmic gradients + starfield)

---



Neumorphism trades contrast for tactile feel. To stay accessible:

1. **Text contrast.** Always use `--color-text-primary` or `--color-text-secondary` for body text. The tertiary color is for decorative em-dashes and placeholders only.
2. **Focus states.** Inputs use a cloud-blue 2px ring on focus (see input recipe). Don't rely on shadow changes alone — keyboard users need a clearly visible outline.
3. **`:active` over JS state.** Use `:active` pseudo-class for press states, not `onMouseDown`/`onMouseUp` — that way keyboard space/enter activation and touch get the right feedback automatically.
4. **Title attributes for icon-only elements.** Mini badges have no text, so they must carry a `title` attribute that names the failed check.
5. **`aria-expanded`** on the chevron of expandable week rows.
6. **`aria-pressed`** on KPI cards when their filter is active.

---

## What NOT to do

- ❌ Pure white backgrounds (`#ffffff`) anywhere except inside the shadow definitions
- ❌ Pure black (`#000000`) text — always use the slate-blue family (light) or light-lavender family (dark)
- ❌ Hard 1px borders — use `--color-divider` as a soft separator only when shadows alone aren't enough
- ❌ Gradients on data visualizations (the bars are solid fills)
- ❌ Glows on text or bars
- ❌ Bright vivid saturation — every color in the palette is muted and warm-balanced
- ❌ Drop shadows on cards (those are flat-design shadows; we use the paired neumorphic pair)
- ❌ Mixing material design depth (`box-shadow: 0 4px 8px rgba(0,0,0,0.1)`) with the neumorphic shadows — they fight each other
- ❌ Showing `0` for missing data — use em-dash
- ❌ Showing 5 green checkmarks when everything passes — use "Alles in orde" text instead
- ❌ **Cold-blue dark themes** — Kairos dark is warm-purple-black, not navy. Pure cold blues betray the brand's warmth.
- ❌ **Branching by theme inside components** — never write `theme === "dark" ? "#fff" : "#000"`. Every theme-aware value belongs in the CSS variable layer.
- ❌ **Overriding tokens locally** — if a semantic color looks wrong in one theme, fix the token, not the component.
- ❌ **Inverting the light theme to get dark** — the colors, ambience, and tone are designed independently. Dark is not "light with the lights off"; it's a different room.
- ❌ **Skipping the starfield in dark** — the dashboard feels flat and lifeless without it.
- ❌ **Cluttering the starfield** — keep it to ~10 dots maximum. Too many feels like a screensaver.

---

## How to use this with Claude Code in Cursor

1. Save this file as `DESIGN_SYSTEM.md` at your repo root.
2. In Cursor settings, add it to your project context (or reference it explicitly: `@DESIGN_SYSTEM.md` in chat).
3. When you ask Claude Code to build a component, prefix with: *"Follow `DESIGN_SYSTEM.md`."*
4. For any visual change, ask Claude Code to first cite which tokens / primitives / recipes it's using — that surfaces drift early.

### Suggested workflow prompts

> "Add a new KPI card variant for `verlof` (leave days). Follow the KPI card recipe in DESIGN_SYSTEM.md and use the cyan semantic palette."

> "Create a settings modal. Use the raised card pattern, neu-input for fields, three-state button for actions. Keep all colors from DESIGN_SYSTEM.md."

> "Audit `features/workforce-log/table.tsx` against DESIGN_SYSTEM.md and list any deviations."

---

## Version

`v1.1` — added full dark-mode token set with warm-purple-black surface, cosmic ambient gradient + starfield, brighter semantic palette for glow against dark, and component guidance for theme-agnostic implementation. May 2026.

`v1.0` — initial system extracted from the Kairos dashboard prototype, May 2026.

Future additions: mobile layout breakpoints, empty-state illustrations, toast/notification recipes, motion-reduced fallbacks.
