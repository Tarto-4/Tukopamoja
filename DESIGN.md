# Design System Inspired by Tuko Pamoja

## 1. Visual Theme & Atmosphere

The Tuko Pamoja design system embodies bold African modernism with a focus on accessibility, collaboration, and forward momentum. The visual language combines striking geometric shapes—organic rounded forms and bold vectors—with a dynamic color palette anchored by vibrant yellow and sophisticated gray neutrals. The aesthetic is contemporary and professional, yet energetic and approachable, reflecting the conference's mission to unite Africa's legal and business leaders. Typography is clean and minimal, allowing generous whitespace to emphasize key messages. The overall mood is confident, inclusive, and purposeful—designed to inspire connection and shared ambition.

**Key Characteristics**
- Bold, organic geometric shapes with soft rounded corners
- High contrast between primary yellow accent and neutral grays
- Generous whitespace and breathing room in layouts
- Minimal, clean typography hierarchy
- Professional yet accessible color story
- Motion-forward design language reflecting collaboration and progress
- Emphasis on readability and scanability

## 2. Color Palette & Roles

### Primary
- **Tuko Yellow** (`#EEDC00`): Primary brand accent and call-to-action elements; used for highlight boxes, buttons, and key visual accents throughout the interface
- **Dark Gray** (`#212529`): Primary text color and navigation elements; used for body copy, headings, and form inputs

### Accent Colors
- **Secondary Yellow** (`#FFC107`): Complementary accent for warning states and secondary highlights; used interchangeably with Tuko Yellow for visual variety
- **Corporate Blue** (`#0D6EFD`): Trust and information accent; used for links and supplementary interactive states
- **Cyan Accent** (`#0DCAF0`): Light accent for tertiary states and hover effects

### Interactive
- **Button Default** (`#F0F0F0`): Default button background; used for secondary and ghost button states
- **Link Text** (`#8F8F8F`): Muted link color for navigation and secondary actions; changes to darker gray on hover

### Neutral Scale
- **White** (`#FFFFFF`): Primary surface and card backgrounds; highest contrast for content areas
- **Light Gray** (`#F8F9FA`): Subtle background for secondary surfaces and lifted containers
- **Medium Gray** (`#E3E3E3`): Border and divider color; used to separate sections and components
- **Dark Neutral** (`#808080`): Secondary text color and muted UI elements; used for meta information and captions
- **Charcoal** (`#343A40`): Deep neutral for dark backgrounds and emphasis
- **Black** (`#000000`): Maximum contrast for primary typography and bold accents

### Surface & Borders
- **Border Color** (`#DEE2E6`): Light separator lines and subtle component borders
- **Divider Gray** (`#F0F0F0`): Horizontal dividers and section separators

### Semantic / Status
- **Error Red** (`#DC3545`): Error states, validation warnings, and destructive actions
- **Success Green** (`#198754`): Confirmation states and positive actions
- **Warning Amber** (`#FFC107`): Alerts and cautionary messages

## 3. Typography Rules

### Font Family
**Primary:** Outfit (`https://fonts.googleapis.com/css2?family=Outfit:wght@200;500&display=swap`)
Fallback stack: `Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

**Secondary:** System sans-serif for fallback contexts
Fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display | Outfit | 32px | 200 | 38.4px | 0px | Large page introductions; rarely used |
| Heading 1 | Outfit | 28px | 400 | 33.6px | 0px | Main page title; primary visual anchor |
| Heading 2 | Outfit | 22.4px | 400 | 26.88px | 0px | Section headings; strong hierarchy |
| Heading 3 | Outfit | 24px | 200 | 28.8px | 0px | Subsection headings; lighter weight for secondary hierarchy |
| Heading 4 | Outfit | 16px | 400 | 19.2px | 0px | Card titles and small headings |
| Heading 5 | Outfit | 16px | 200 | 19.2px | 0px | Secondary card titles; subtle headings |
| Body | Outfit | 16px | 400 | 22.4px | 0px | Primary body text; default reading size |
| Body Small | Outfit | 14px | 400 | 19.6px | 0px | Secondary body text and descriptions |
| Button | Outfit | 16px | 400 | 22.4px | 0px | Button and link text; medium weight for clarity |
| Caption | Outfit | 13.6px | 400 | 16.32px | 0px | Captions, meta text, timestamps |
| Code | Outfit | 13.6px | 400 | 16.32px | 0px | Monospace contexts; fixed-width appearance |

### Principles
- **Minimalist Hierarchy:** Weight changes (200 to 400) create distinction without excessive size variation
- **Generous Leading:** All line heights exceed 1.2x the font size for optimal readability in print and digital
- **Outfit Consistency:** Single typeface family across all scales ensures cohesive, modern appearance
- **Accessibility First:** Sufficient contrast and size thresholds ensure compliance with WCAG AA standards
- **Breathing Room:** Whitespace around typography is as important as the letterforms themselves

## 4. Component Stylings

### Buttons

**Primary Button (Call-to-Action)**
- Background: `#EEDC00`
- Text Color: `#000000`
- Font Size: `16px`
- Font Weight: `400`
- Font Family: `Outfit, sans-serif`
- Padding: `12px 24px`
- Border Radius: `8px`
- Border: `none`
- Box Shadow: `0px 2px 8px rgba(0, 0, 0, 0.12)`
- Line Height: `22.4px`
- Hover State: Background `#E6CC00`, Box Shadow `0px 4px 12px rgba(0, 0, 0, 0.2)`
- Active State: Background `#D4B800`, Box Shadow `0px 1px 4px rgba(0, 0, 0, 0.15)`
- Disabled State: Background `#F0F0F0`, Text Color `#808080`, Box Shadow `none`

**Secondary Button**
- Background: `#F0F0F0`
- Text Color: `#212529`
- Font Size: `16px`
- Font Weight: `400`
- Font Family: `Outfit, sans-serif`
- Padding: `12px 24px`
- Border Radius: `8px`
- Border: `1px solid #E3E3E3`
- Box Shadow: `none`
- Line Height: `22.4px`
- Hover State: Background `#E3E3E3`, Border Color `#DEE2E6`
- Active State: Background `#D4D4D4`
- Disabled State: Background `#F8F9FA`, Text Color `#8F8F8F`, Border Color `#E3E3E3`

**Ghost Button**
- Background: `transparent`
- Text Color: `#212529`
- Font Size: `16px`
- Font Weight: `400`
- Font Family: `Outfit, sans-serif`
- Padding: `12px 24px`
- Border Radius: `8px`
- Border: `2px solid #212529`
- Box Shadow: `none`
- Line Height: `22.4px`
- Hover State: Background `#F8F9FA`, Border Color `#212529`
- Active State: Background `#E3E3E3`, Border Color `#212529`
- Disabled State: Border Color `#DEE2E6`, Text Color `#8F8F8F`

### Cards & Containers

**Primary Card**
- Background: `#FFFFFF`
- Text Color: `#212529`
- Padding: `24px`
- Border Radius: `16px`
- Border: `1px solid #DEE2E6`
- Box Shadow: `0px 2px 8px rgba(0, 0, 0, 0.06)`
- Gap Between Elements: `16px`

**Highlight Card (Yellow Accent)**
- Background: `#EEDC00`
- Text Color: `#000000`
- Padding: `20px`
- Border Radius: `16px`
- Border: `none`
- Box Shadow: `0px 2px 8px rgba(0, 0, 0, 0.1)`
- Font Size: `16px`
- Font Weight: `400`
- Line Height: `22.4px`

**Neutral Container**
- Background: `#F8F9FA`
- Text Color: `#212529`
- Padding: `20px`
- Border Radius: `8px`
- Border: `1px solid #E3E3E3`
- Box Shadow: `none`

### Inputs & Forms

**Text Input (Default)**
- Background: `#FFFFFF`
- Text Color: `#212529`
- Border: `1px solid #DEE2E6`
- Border Radius: `4px`
- Padding: `12px 16px`
- Font Size: `16px`
- Font Weight: `400`
- Font Family: `Outfit, sans-serif`
- Line Height: `22.4px`
- Focus State: Border Color `#0D6EFD`, Box Shadow `0px 0px 0px 3px rgba(13, 110, 253, 0.1)`
- Disabled State: Background `#F8F9FA`, Border Color `#E3E3E3`, Text Color `#808080`

**Form Label**
- Text Color: `#212529`
- Font Size: `16px`
- Font Weight: `400`
- Font Family: `Outfit, sans-serif`
- Line Height: `19.2px`
- Margin Bottom: `8px`

**Placeholder Text**
- Text Color: `#8F8F8F`
- Font Size: `16px`
- Font Weight: `400`
- Font Style: `italic`

### Navigation

**Navigation Container**
- Background: `#212529`
- Text Color: `#FFFFFF`
- Font Size: `16px`
- Font Weight: `200`
- Font Family: `Outfit, sans-serif`
- Line Height: `22.4px`
- Padding: `16px 20px`
- Box Shadow: `0px 2px 8px rgba(0, 0, 0, 0.1)`

**Navigation Link (Default)**
- Text Color: `#FFFFFF`
- Font Size: `16px`
- Font Weight: `200`
- Font Family: `Outfit, sans-serif`
- Line Height: `22.4px`
- Padding: `12px 16px`
- Hover State: Text Color `#EEDC00`, Background `rgba(238, 220, 0, 0.1)`
- Active State: Text Color `#EEDC00`, Border Bottom `2px solid #EEDC00`

**Secondary Navigation Link**
- Text Color: `#8F8F8F`
- Font Size: `16px`
- Font Weight: `200`
- Font Family: `Outfit, sans-serif`
- Line Height: `22.4px`
- Padding: `12px 16px`
- Hover State: Text Color `#212529`
- Active State: Text Color `#212529`

### Badges

**Primary Badge**
- Background: `#EEDC00`
- Text Color: `#000000`
- Font Size: `13.6px`
- Font Weight: `400`
- Font Family: `Outfit, sans-serif`
- Padding: `4px 12px`
- Border Radius: `12px`
- Border: `none`
- Line Height: `16.32px`

**Secondary Badge**
- Background: `#E3E3E3`
- Text Color: `#212529`
- Font Size: `13.6px`
- Font Weight: `400`
- Font Family: `Outfit, sans-serif`
- Padding: `4px 12px`
- Border Radius: `12px`
- Border: `none`
- Line Height: `16.32px`

**Status Badge (Success)**
- Background: `#198754`
- Text Color: `#FFFFFF`
- Font Size: `13.6px`
- Font Weight: `400`
- Padding: `4px 12px`
- Border Radius: `12px`

## 5. Layout Principles

### Spacing System
**Base Unit:** `4px`

**Scale:** Multiples of base unit create consistent rhythm
- `4px` – Micro spacing for tight component padding
- `8px` – Compact spacing for element proximity
- `12px` – Small spacing for component padding
- `16px` – Default gap between sections and flex items
- `20px` – Medium padding for cards and containers
- `24px` – Large margin between major sections
- `28px` – Extra-large padding for card insides
- `32px` – Large margin between page sections
- `36px` – Extra padding for full-bleed containers
- `40px` – Extra-large margin for layout divisions
- `44px` – Large padding for hero sections
- `48px` – Maximum padding for premium spacing

**Usage Context:**
- Component padding: `12px–28px` depending on component density
- Element gaps: `8px–16px` for tight, related elements
- Section margins: `24px–48px` for major layout breaks
- Page margins: `20px–40px` depending on screen size

### Grid & Container
- **Max Width:** `1200px` for desktop layouts
- **Column Strategy:** 12-column responsive grid with gutters of `16px`
- **Mobile First:** Base layout assumes single column; expands at breakpoints
- **Section Patterns:** Alternating full-width and contained sections create rhythm
- **Padding:** Minimum `20px` on mobile, scaling to `40px` on desktop

### Whitespace Philosophy
Generous whitespace is intentional and purposeful. Typography and interactive elements are surrounded by ample space to reduce cognitive load and improve scannability. Section breaks use vertical rhythm multiples (`24px`, `32px`, `48px`) to create visual hierarchy without explicit lines. Cards and containers breathe; no element feels crowded.

### Border Radius Scale
- `0px` – Buttons and inputs in minimal, flat design contexts
- `4px` – Subtle rounding for inputs and small components
- `8px` – Standard rounding for cards and medium containers
- `12px` – Badges and pills
- `16px` – Images and prominent card containers
- `20px` – Large geometric shapes and hero containers
- `50%` – Fully circular avatars and icon buttons

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow, 1px border | Input fields, ghost buttons, outlined components |
| Raised (1) | `0px 2px 8px rgba(0, 0, 0, 0.06)` | Cards, standard containers, normal state |
| Elevated (2) | `0px 2px 8px rgba(0, 0, 0, 0.12)` | Primary buttons, hovered cards, interactive focus |
| Floating (3) | `0px 4px 12px rgba(0, 0, 0, 0.2)` | Hovered buttons, modals, dropdown menus |
| Overlay (4) | `0px 8px 16px rgba(0, 0, 0, 0.25)` | Modals, full-screen overlays, popovers |

**Shadow Philosophy:** Shadows are subtle and purposeful, reserved for interactive and elevated states. The design favors flat, minimal shadows over dramatic depth. Shadows only appear on hover or active states to draw attention to interactive elements. Layering is achieved through color value changes and spatial separation rather than heavy shadows. This maintains the clean, modern aesthetic while providing sufficient depth cues for usability.

## 7. Do's and Don'ts

### Do
- Use `#EEDC00` (Tuko Yellow) as the primary call-to-action color to drive engagement and visibility
- Maintain a minimum padding of `12px` on all interactive elements for touch accessibility
- Apply consistent `16px` line-height to all body text for optimal readability
- Stack elements vertically with `24px–32px` margins between major sections
- Use `#F8F9FA` as a gentle background to lift secondary content areas
- Employ weight changes (200 to 400) in Outfit font to create hierarchy without excessive sizing
- Reserve the `#0D6EFD` blue accent for interactive states, links, and focus indicators
- Keep card borders at `1px` with `#DEE2E6` for subtle definition
- Apply hover states with shadow elevation (`0px 2px 8px`) to encourage interaction
- Use organic `16px` border-radius on hero and highlight containers for modern aesthetic

### Don't
- Mix multiple typeface families outside of Outfit; system fallbacks only as backup
- Apply box shadows greater than `0px 8px 16px` as the design favors flatness
- Use spacing values outside the defined scale; maintain `4px` multiples
- Apply `#FFC107` and `#EEDC00` simultaneously in the same component; choose one accent
- Create text with less than `12px` font size for body content; maintain legibility
- Use more than two font weights in a single interface; stick to 200 and 400
- Apply background colors to text with insufficient contrast (minimum 4.5:1 WCAG AA)
- Justify text alignment; prefer left-aligned or center for emphasis
- Nest components deeper than two levels without clear visual separation
- Override button padding below `12px`; maintain touch target sizing

## 8. Responsive Behavior

### Breakpoints

| Breakpoint Name | Width | Key Changes |
|-----------------|-------|-------------|
| Mobile | `320px–479px` | Single-column layout, `16px` padding, `12px` gap, stacked navigation |
| Tablet Small | `480px–767px` | Single or two-column grid, `20px` padding, `16px` gap, collapsible sections |
| Tablet | `768px–1023px` | Two-column grid, `24px` padding, `16px` gap, side navigation visible |
| Desktop | `1024px–1439px` | Three-column grid, `32px` padding, `16px` gap, full navigation |
| Desktop Large | `1440px+` | Max width `1200px` centered, `40px` padding, full-width sections alternate |

### Touch Targets
- **Minimum Height:** `48px` for all interactive elements (buttons, links, inputs)
- **Minimum Width:** `48px` for icon buttons; `80px` for text buttons
- **Spacing Between:** Minimum `8px` horizontal, `8px` vertical between adjacent touch targets
- **Hover Areas:** Extend clickable area `4px` beyond visible element boundaries

### Collapsing Strategy
- **Mobile:** Hamburger menu replaces horizontal navigation; cards stack single-column
- **Tablet Small:** Navigation sidebar collapses into drawer; two-column layouts are conditional
- **Tablet:** Side navigation appears; grid expands to two columns with reduced gutters
- **Desktop:** Full navigation visible; containers expand to max-width with centered alignment
- **Images:** Scale proportionally from `80px` on mobile to `300px` on desktop
- **Typography:** Base sizes reduce `1px–2px` on mobile; increase on desktop
- **Padding:** `16px` on mobile, `24px` on tablet, `32px–40px` on desktop

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA:** Tuko Yellow (`#EEDC00`)
- **Primary Text:** Dark Gray (`#212529`)
- **Background:** White (`#FFFFFF`)
- **Secondary Background:** Light Gray (`#F8F9FA`)
- **Border/Divider:** Medium Gray (`#DEE2E6`)
- **Heading Text:** Dark Gray (`#212529`)
- **Body Text:** Dark Gray (`#212529`)
- **Muted Text:** Dark Neutral (`#808080`)
- **Success State:** Success Green (`#198754`)
- **Error State:** Error Red (`#DC3545`)
- **Warning State:** Warning Amber (`#FFC107`)
- **Link Color:** Light Neutral (`#8F8F8F`) → hover: Dark Gray (`#212529`)
- **Navigation Background:** Dark Gray (`#212529`)

### Iteration Guide
1. **Every button defaults to `16px` Outfit, weight 400, line-height `22.4px`; only override for specific visual roles (primary/secondary/ghost)**
2. **All spacing follows `4px` base unit multiples; use `12px–24px` for component padding, `16px–32px` for layout gaps**
3. **Cards and containers use `#FFFFFF` background with `1px` border (`#DEE2E6`) and soft shadow (`0px 2px 8px rgba(0,0,0,0.06)`)**
4. **Typography hierarchy relies on weight (200/400) and size (13.6px–32px) in Outfit; no other typefaces**
5. **Primary accent is always `#EEDC00`; use for CTAs, highlights, and key interactive states**
6. **Hover states add shadow elevation and darken background by 10–15% or shift color to complementary; never add underline**
7. **Border radius defaults to `0px` for sharp inputs, `8px` for cards, `16px` for hero/highlight containers, `50%` for avatars**
8. **Navigation links are `#FFFFFF` in `#212529` dark containers; hover state shifts to `#EEDC00` with subtle background tint**
9. **All touch targets (buttons, inputs, links) maintain minimum `48px` height and `8px` spacing between adjacent elements**
10. **Focus states add `3px` outline in `rgba(13, 110, 253, 0.1)` (blue focus indicator); visible on keyboard navigation**