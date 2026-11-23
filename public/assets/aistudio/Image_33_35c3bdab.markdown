---
name: Serene Hearth
colors:
  surface: '#ecfeef'
  surface-dim: '#cdded0'
  surface-bright: '#ecfeef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e6f8e9'
  surface-container: '#e1f2e3'
  surface-container-high: '#dbedde'
  surface-container-highest: '#d5e7d8'
  on-surface: '#101f16'
  on-surface-variant: '#424842'
  inverse-surface: '#25342a'
  inverse-on-surface: '#e3f5e6'
  outline: '#727971'
  outline-variant: '#c2c8c0'
  surface-tint: '#43664b'
  primary: '#3a5d43'
  on-primary: '#ffffff'
  primary-container: '#52765a'
  on-primary-container: '#d3fcd9'
  inverse-primary: '#a9d0af'
  secondary: '#546257'
  on-secondary: '#ffffff'
  secondary-container: '#d7e6d8'
  on-secondary-container: '#5a685d'
  tertiary: '#58564e'
  on-tertiary: '#ffffff'
  tertiary-container: '#716e66'
  on-tertiary-container: '#f6f1e7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4ecca'
  primary-fixed-dim: '#a9d0af'
  on-primary-fixed: '#00210d'
  on-primary-fixed-variant: '#2b4e35'
  secondary-fixed: '#d7e6d8'
  secondary-fixed-dim: '#bbcabd'
  on-secondary-fixed: '#121e16'
  on-secondary-fixed-variant: '#3d4a40'
  tertiary-fixed: '#e7e2d8'
  tertiary-fixed-dim: '#cac6bd'
  on-tertiary-fixed: '#1d1c16'
  on-tertiary-fixed-variant: '#494740'
  background: '#ecfeef'
  on-background: '#101f16'
  surface-variant: '#d5e7d8'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is tailored for an emotionally vulnerable context: losing or searching for a companion pet. The brand personality conveys safety, warmth, patience, and grounded optimism. The emotional response must reduce anxiety, dismantle cognitive friction, and inspire collective civic action across Brazilian communities.

The design movement combines **Mindful Minimalism** with **Organic Tactility**. We deploy spacious, soothing surfaces, muted botanical pastels, and gentle tactile surfaces that reassure distressed users rather than overwhelming them with high-stress alerts. Interfaces emphasize natural breathing room, soft contours, clear structural hierarchy, and deeply empathetic, scannable information flows in Brazilian Portuguese.

## Colors

The palette draws directly from serene botanical earth tones, anchoring stressful moments in grounded tranquility:

- **Primary (`#52765A`)**: Forest/Sage green, used for core action drivers, active focus rings, primary brand touchpoints, and clear interactive commitments.
- **Secondary (`#DCEBDD`)**: Light Sage, used for supportive accent containers, active tag pills, and contextual highlight areas.
- **Tertiary (`#F3EEE4`)**: Warm Neutral cream, used to provide cozy balance, contrast against card regions, and highlight domestic/pet information cards.
- **Surface & Backgrounds**:
  - Main App Canvas: `#F7F9F6` (restful off-white sage wash)
  - Card & Container Fill: `#FFFFFF` (pure white to pop forward softly)
  - Subtle Callouts / Fresh Badges: `#EAF5EC` (pale mint)
- **Text & Content**:
  - Primary Content & Titles: `#26352B` (deep mineral green-black, fulfilling WCAG AAA contrast against light backgrounds)
  - Secondary Metadata & Hints: `#6B786D` (gentle muted slate-sage)
- **Borders & Dividers**: `#E2E9E1` (ultra-soft structural perimeter)

### Semantic Color Guidance
- **Alert / Perdido (Lost Pet)**: Muted terracotta `#C85A48` used sparingly for urgent tags to avoid inducing panic.
- **Success / Reencontrado (Reunited)**: Harmonious botanical emerald `#3E7B52` paired with `#EAF5EC`.

## Typography

The typographic hierarchy pairs **Manrope** for expressive, human-centered headings with **Inter** for pristine functional legibility across forms, status labels, and body text. 

- **Manrope**: Gives headings an approachable, modern warmth with rounded geometric terminals, easing emotional tension.
- **Inter**: Provides hyper-legible communication for critical identification details (microchip numbers, neighborhood names, contact info).
- Brazilian Portuguese formatting conventions should be strictly upheld: decimal commas for distances (`2,5 km`), 24-hour time notations (`14h30`), and localized uppercase accented glyphs (`Á`, `É`, `Õ`, `Ç`) handled with balanced line heights to prevent visual clipping.

## Layout & Spacing

The layout is built upon an 8pt rhythm scale that favors generous white space to prevent cognitive overload.

- **Desktop (>= 1024px)**: 12-column fluid grid, max container width of `1200px`, `gutter` of `1.5rem` (24px), outer page margins of `2rem` (32px).
- **Tablet (768px - 1023px)**: 8-column grid with `1.5rem` gutters and `1.5rem` margins.
- **Mobile (< 768px)**: 4-column layout, `gutter-sm` of `1rem` (16px), and outer screen margins of `1rem` (16px).

Content density must remain airy. Complex multi-step pet declaration flows must break into bite-sized card segments separated by `space-lg` to maintain psychological ease.

## Elevation & Depth

Visual hierarchy uses a tranquil combination of **Tonal Layering** and **Restrained Diffused Shadows**:

- **Surface Layering**: The primary foundation is `#F7F9F6`. Higher-priority surfaces (such as pet cards and notification blocks) sit on pure `#FFFFFF`, outlined by `#E2E9E1`.
- **Restrained Ambient Shadows**: Never use pure black shadows. Shadows must be delicately tinted with deep sage `#26352B` at extreme diffusion:
  - *Resting Card Elevation*: `0 2px 8px -2px rgba(38, 53, 43, 0.04), 0 1px 3px 0 rgba(38, 53, 43, 0.02)`
  - *Floating / Hover Elevation*: `0 12px 24px -4px rgba(38, 53, 43, 0.07), 0 4px 8px -2px rgba(38, 53, 43, 0.03)`
  - *Modal & Drawer Elevation*: `0 20px 32px -8px rgba(38, 53, 43, 0.12), 0 8px 16px -4px rgba(38, 53, 43, 0.04)`
- **Structural Outlines**: Every elevated card maintains a 1px border of `#E2E9E1` to retain structural integrity even on uncalibrated or high-brightness mobile screens in direct sunlight.

## Shapes

The shape scale relies on soft, comforting curves (`roundedness: 2` base), eliminating sharp corners to reinforce safety and emotional softness:

- **Base Components (Inputs, Buttons, Badges)**: `0.5rem` (8px).
- **Cards & Modal Dialogs (`rounded-lg`)**: `1rem` (16px).
- **Hero Banners & Pet Detail Carousels (`rounded-xl`)**: `1.5rem` (24px).
- **Interactive Action Pills & Tag Badges**: Fully rounded circular caps (`9999px`) to create tactile, friendly tap targets.

## Components

### Buttons & CTAs
- **Primary Action (e.g., "Cadastrar Pet Desaparecido")**: Background `#52765A`, text `#FFFFFF`, font `label-lg`, height `48px`, border-radius `8px`. Hover: darken to `#425E48`. High-contrast, reassuring, and unmistakable.
- **Secondary Action (e.g., "Ver Detalhes", "Filtrar")**: Background `#DCEBDD`, text `#26352B`, border 1px solid transparent. Hover: background `#D0E3D2`.
- **Tertiary / Ghost Action**: Background transparent, text `#52765A`, hover background `#EAF5EC`.

### Pet Profile Cards
- Built on `#FFFFFF` with 1px border `#E2E9E1` and `rounded-lg` (16px).
- Top asset area features pet photography clipped with 12px inner corner radii.
- Status badge floats top-left:
  - *Desaparecido*: Background `#FDF0ED`, text `#B04332`, border `#F7D2CC`.
  - *Encontrado*: Background `#EAF5EC`, text `#3E7B52`, border `#CDE6D2`.
- Text cluster specifies pet name (`headline-sm`), species/breed (`body-sm`, `#6B786D`), and neighborhood pinpoint (`label-md`, `#52765A`).

### Form Inputs & Textareas
- Height `48px` (inputs), padding `0 16px`, background `#FFFFFF`, border `1px solid #E2E9E1`, border-radius `8px`.
- Text color `#26352B`, placeholder color `#6B786D`.
- **Focused State**: Border color `#52765A`, subtle outer ring `0 0 0 3px rgba(82, 118, 90, 0.20)`.

### Chips & Filters
- Compact pill-shaped elements (`padding: 6px 14px; border-radius: 9999px;`).
- Unselected: Background `#FFFFFF`, text `#6B786D`, border `1px solid #E2E9E1`.
- Selected: Background `#52765A`, text `#FFFFFF`, border `1px solid #52765A`.

### Checkboxes & Radio Buttons
- 20px x 20px, border-radius `6px` (checkboxes) and `50%` (radios).
- Default: Border `2px solid #E2E9E1`, background `#FFFFFF`.
- Checked: Border `2px solid #52765A`, background `#52765A` with crisp white inner check/dot.

### Community Alert Banner (Sighting / Avistamento)
- Subtle banner background `#F3EEE4` with a warm border `#E7DDD0` and `rounded-lg` (16px).
- Features clean line icons in `#52765A` and concise instructions helping neighbors report sightings in real-time.