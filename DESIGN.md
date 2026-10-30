---
name: BazaarGhost
description: Bazaar ghost data from streams
colors:
  primary: "#ff9933"
  background: "#fcf9ea"
  foreground: "#1a1a1a"
  card: "#faf6e8"
  muted: "#f0e9d8"
  muted-foreground: "#5a5a5a"
  hero-muted: "#8a6b2b"
  border: "#e8dfc8"
  dark-background: "#1a1a1a"
  dark-foreground: "#f5f5f5"
  dark-card: "#242424"
  dark-muted: "#2d2d2d"
  dark-muted-foreground: "#a0a0a0"
  dark-hero-muted: "#b99a53"
  dark-border: "#333333"
  destructive: "#ef4444"
typography:
  display:
    fontFamily: 'var(--font-averia-libre), "Source Serif 4", "Source Serif 4 Fallback"'
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: 'var(--font-averia-libre), "Source Serif 4", "Source Serif 4 Fallback"'
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontSize: "1.25rem"
    lineHeight: 1.4
  body:
    fontSize: "1rem"
    lineHeight: 1.5
  label:
    fontSize: "0.875rem"
    lineHeight: 1.4285714286
  metadata:
    fontSize: "0.75rem"
    lineHeight: 1.3333333333
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    typography: "{typography.label}"
    height: "36px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "var(--background)"
    textColor: "var(--foreground)"
    rounded: "{rounded.md}"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    rounded: "{rounded.md}"
    height: "36px"
  input:
    rounded: "{rounded.md}"
    height: "36px"
    padding: "4px 12px"
  badge-secondary:
    backgroundColor: "var(--secondary)"
    textColor: "var(--secondary-foreground)"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  card:
    backgroundColor: "var(--card)"
    textColor: "var(--card-foreground)"
    rounded: "{rounded.xl}"
    padding: "24px"
  preview-row:
    rounded: "{rounded.lg}"
    padding: "12px"
---

# Design System: BazaarGhost

## Overview

**Creative North Star: "Incumbent cream/charcoal/orange interface"**

BazaarGhost pairs cream or charcoal backgrounds with orange actions, Averia Libre public-page typography, and existing hero emblems. Dense lists and restrained borders keep recordings and matchups readable.

This records the implemented system, not a redesign. Source authority is `app/globals.css`, `app/layout.tsx`, `components/ui`, and `components/navbar.tsx`. The landing implementation in `app/(app)/page.tsx` and `components/landing` extends that system. Its selected concept and exact copy remain in `.impeccable/surfaces/landing.md`.

**Key Characteristics:**

- Cream and charcoal theme pairs with a shared orange accent.
- Averia Libre on public pages and the wordmark.
- Hairline dividers, compact controls, and tonal selection states.

## Colors

### Primary

Orange supplies actions, focus rings, navigation branding, and selected accents. `--accent` and `--ring` reuse `--primary`'s color. Landing buttons use dark text in both themes through a local `--primary-foreground` override; the button token above records that readable treatment.

### Neutral

The unprefixed colors describe `:root`; `dark-*` records `.dark` overrides of the same semantic properties. Cream backgrounds use darker cream cards, muted fills, and warm borders. Charcoal backgrounds use lighter charcoal cards, gray dividers, and pale foreground text. `hero-muted` supplies subdued gold titles in light mode and hero details in both modes. Secondary fills reuse the muted palette.

Destructive red marks errors. Selection uses a 10% orange fill rather than a new palette color.

**The Theme Pair Rule.** Use semantic CSS properties so a component follows both existing themes.

## Typography

Averia Libre regular and bold load locally. The public landing page and navigation explicitly select the serif stack recorded above. Other components inherit their parent's font; loading Inter and JetBrains Mono variables alone does not assign them to every component.

The display role grows to 3.75rem when the landing container reaches 32rem. The subtitle uses the title role, growing to 1.5rem at the same width. Archive totals use the headline role and tabular numerals. Navigation and form labels use the label role; list metadata uses the smallest role. The wordmark uses bold title-size text.

## Layout

Public navigation and the landing page share a centered 72rem maximum width. The landing page has 20px horizontal padding. Its title and search form become two columns at a 56rem container width; the archive changes from stacked sections to three columns at that same threshold. Navigation reveals inline links at a 36rem container width while retaining the menu button.

Spacing follows the existing 4px rhythm. List rows have an 88px minimum height, 12px padding, and 12px internal gaps. Browse links have a 44px minimum height. Feed viewports are 288px tall on compact layouts and 352px tall in the three-column layout. The landing search input and submit button are 56px tall. Compact layouts preserve content order and let footer links wrap.

## Elevation & Depth

Borders and muted fills provide most separation. Shared inputs and outline buttons use `--shadow-xs`; shared cards use `--shadow-sm`. Shadow geometry comes from the existing theme-aware variables in `app/globals.css`. The landing archive uses dividers without raised card wrappers.

## Shapes

Controls use the medium radius, selectable rows the large radius, and shared cards the extra-large radius. Avatars and badges are circular or pill-shaped. Dividers and field borders are 1px. Existing logo and hero assets retain their silhouettes.

## Components

- **Buttons:** Primary, outline, and ghost variants come from `components/ui/button.tsx`. Primary hover reduces the orange fill to 90%; outline and ghost hover use the muted fill. Keyboard focus uses a 3px half-opacity ring. Disabled controls use 50% opacity. Large icon-bearing buttons use 16px horizontal padding.
- **Inputs:** Transparent in light mode and a 30% input-color fill in dark mode, with an input-color border and muted placeholder. Focus changes the border to the ring color and adds the shared focus ring. Invalid fields use destructive border and ring colors.
- **Badges:** Compact pill labels with primary, secondary, outline, and other shared variants. The sidecar samples the neutral secondary variant.
- **Cards:** A card-color fill, border, small shadow, and 24px content insets. These remain available to other pages; they are not required around each list.
- **Navigation:** A card-color bar with a bottom border, existing logo, orange wordmark, muted links, and a right-hand menu sheet. Links brighten on hover; keyboard focus remains visible. Coarse pointers receive at least 44px menu and brand targets.
- **Preview rows:** Entire rows are links to the existing workspace, with prefetch disabled. Hover uses a 10% orange tint; focus uses a 2px inset ring. Metadata truncates and titles can occupy two lines. Each column has its own pause and resume button.

Shared controls use short color and shadow transitions. Landing feeds scroll independently at 12, 24, and 36 CSS pixels per second. Each list resets at its end. Hover, focus, reduced motion, hidden tabs, and offscreen feeds pause animation. Manual scrolling pauses until the user presses Resume. The elaborate animated panel remains deferred.

## Do's and Don'ts

### Do:

- Do reuse the existing semantic colors, local typeface, logo, and hero emblems.
- Do keep selected rows, hover states, and keyboard focus visually distinct.
- Do preserve readable text in both themes when reusing orange actions.

### Don't:

- Don't replace the incumbent visual identity as part of a new page.
- Don't turn a landing-specific composition or deferred animation into a global rule.
