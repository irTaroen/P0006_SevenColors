<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:kairos-design-rules -->
# Kairos Design System — Rules for All Components

The design system is documented in `frontend/design/DESIGN.md`. Reference design prototypes are in `frontend/design/`. These rules are non-negotiable — follow them for every component and page you build or modify.

## Token usage

- **Always use `var(--k-*)` CSS variables** for colors, shadows, and surfaces. Never hardcode hex values in components.
- **Never use `var(--background)` / `bg-background` for page surfaces** — use `var(--k-bg)` directly.
- **Never branch by theme inside a component.** No `resolvedTheme === "dark" ? x : y`. Fix theme-specific values in `globals.css`, not in JSX.
- When a color looks wrong in one theme, fix the token in `globals.css` — never override locally.

## Interactive elements (buttons, cards, filters)

Every interactive surface follows the **three-state neumorphic pattern**:

| State   | Shadow                    | Transform         | Color              |
|---------|---------------------------|-------------------|--------------------|
| Rest    | `var(--k-shadow-raised-sm)` | none            | `var(--k-text-primary)` |
| Hover   | `var(--k-shadow-lifted-sm)` | `translateY(-1px)` | `var(--k-cloud-deep)` |
| Active  | `var(--k-shadow-inset-sm)`  | `translateY(0)` | `var(--k-cloud-deep)` |

Use the `.neu-button` utility class (from `globals.css`) for pill/rect buttons or `variant="neu"` on the `<Button>` component.
Use `.neu-button-icon` or `variant="neu-icon"` for circular icon buttons.

## Inputs

All filter and search inputs use `.neu-input` or `<NeuInput>` from `components/ui/input.tsx`:
- Inset shadow at rest (`var(--k-shadow-inset-sm)`)
- Cloud-blue ring on focus
- Pill border-radius (9999px)
- No visible border

## Cards / panels

- Dashboard panels (table, KPI section, etc.): `<NeuCard>` or `.neu-card` (raised)
- Inset wells (badges, status chips, capacity bar track): `.neu-card-inset-sm`
- Never mix neumorphic shadows with `shadow-sm` or standard `box-shadow: 0 4px 8px rgba(0,0,0,0.1)`

## Data rules

- **Null/undefined numeric values display as `—`** (em-dash U+2014) styled with `color: var(--k-text-tertiary); fontWeight: 300`. Never show `0` for missing data.
- **Numeric columns always use `font-variant-numeric: tabular-nums`** so digits align vertically.
- **Clean rows** (no check failures) show a single "Alles in orde" confirmation, not multiple green checkmarks.

## Color semantics

Cloud-blue (`--k-cloud-deep`) is reserved for: active states, focus rings, hover text, brand moments. Never use it decoratively.

Each semantic color maps to a specific check type — keep them in lockstep across KPI cards, badges, and mini-badges:
- amber → compleet
- red → geaccordeerd
- purple → payroll
- grey → capaciteit
- yellow → dubbel
- green → "Alles in orde" / positive confirmations

## Accessibility

- `aria-pressed` on KPI cards when their filter is active
- `aria-expanded` on expandable row chevrons
- `title` attribute on icon-only mini badges (no visible text)
- Focus rings via the cloud-blue 2px ring on `.neu-input:focus` — never rely on shadow changes alone

## What NOT to do

- ❌ Hardcoded hex values in component files
- ❌ `box-shadow: 0 4px 8px rgba(0,0,0,0.1)` — use the `--k-shadow-*` variables
- ❌ Pure white backgrounds (`#ffffff`) anywhere except inside shadow definitions
- ❌ Gradients on data visualizations (capacity bars are solid fills)
- ❌ Branching by theme inside JSX or inline styles
- ❌ Showing `0` for missing data — use em-dash
- ❌ Five green checkmarks for a passing row — use "Alles in orde" instead
<!-- END:kairos-design-rules -->
