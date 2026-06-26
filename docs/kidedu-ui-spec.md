---
name: Gentle Learning System
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#424939'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#737a68'
  outline-variant: '#c2c9b5'
  surface-tint: '#3c6a00'
  primary: '#3c6a00'
  on-primary: '#ffffff'
  primary-container: '#7cb342'
  on-primary-container: '#234100'
  inverse-primary: '#9dd761'
  secondary: '#686000'
  on-secondary: '#ffffff'
  secondary-container: '#f0e269'
  on-secondary-container: '#6d6400'
  tertiary: '#006398'
  on-tertiary: '#ffffff'
  tertiary-container: '#58aaea'
  on-tertiary-container: '#003d60'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b8f47a'
  primary-fixed-dim: '#9dd761'
  on-primary-fixed: '#0e2000'
  on-primary-fixed-variant: '#2c5000'
  secondary-fixed: '#f3e56c'
  secondary-fixed-dim: '#d6c953'
  on-secondary-fixed: '#1f1c00'
  on-secondary-fixed-variant: '#4e4800'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#94ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
  soft-green: '#E8F5E9'
  warm-yellow: '#FFFDE7'
  gentle-blue: '#E3F2FD'
  high-contrast-text: '#2C3E50'
  parent-accent: '#5C6BC0'
typography:
  word-focus-lg:
    fontFamily: beVietnamPro
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  word-focus-mobile:
    fontFamily: beVietnamPro
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: plusJakartaSans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: beVietnamPro
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  label-caps:
    fontFamily: plusJakartaSans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-target-min: 48px
  container-padding: 24px
  video-ratio-mobile: '0.6'
  gutter: 16px
responsive:
  base-mobile-reference-width: 390px
  app-shell-max-width: 430px
  small-mobile-min-width: 320px
  tablet-breakpoint: 768px
  screen-padding-fluid: 'clamp(16px, 6vw, 24px)'
  viewport-min-height: 100dvh
  bottom-nav-height: 72px
  bottom-nav-safe-padding: 'env(safe-area-inset-bottom)'
  content-bottom-padding: 'calc(88px + env(safe-area-inset-bottom))'
  touch-target-min: 48px
codex:
  role: 'Shared KidEDU UI design system and implementation contract'
  screenshot-role: 'Visual reference and layout ground truth for each page'
  markdown-role: 'Design tokens, interaction rules, responsiveness rules, and component contract'
  source-priority:
    - 'Existing project architecture and framework conventions'
    - 'Product and user-flow documents, when provided'
    - 'This design system for tokens, accessibility, motion, interaction, and sensory rules'
    - 'Page-specific screenshot for visual hierarchy, layout proportions, spacing balance, and exact content order'
    - 'Page-specific screen notes, when provided, for copy, state, route, and behavior details'
  ignore-screenshot-artifacts:
    - 'Stitch/Figma blue selection borders'
    - 'Resize handles'
    - 'Red canvas outlines'
    - 'Dotted editor backgrounds'
    - 'Exported size labels such as 390 x 1249'
    - 'Browser/editor chrome outside the app frame'
  implementation-style:
    - 'Mobile-first responsive UI'
    - 'Reusable components, not one-off static HTML'
    - 'No fixed screenshot height'
    - 'No hardcoded card widths copied from Stitch'
    - 'Use width: 100% inside constrained containers'
    - 'Use safe-area insets for fixed bottom navigation'
---

## Brand & Style

The design system is built on a "Child-First, Sensory-Friendly" philosophy, specifically tailored for children with speech delays and neurodivergent learners. The brand personality is **Supportive, Patient, and Purposeful**, eschewing the typical high-energy, overstimulating aesthetics of children's entertainment in favor of a clinical tool disguised as a warm companion.

The design style is a blend of **Soft Minimalism** and **Tactile UI**. It prioritizes extreme clarity and reduces cognitive load by removing background noise—both visual and auditory. Key characteristics include:
- **Low-Stimulus Environments:** Generous negative space and a lack of decorative "clutter."
- **High-Fidelity Focus:** Visual emphasis is placed exclusively on the learning subject (the mouth area or the primary word illustration).
- **Temporal Safety:** Interactions are deliberate, using timing (like the 1-second hold) as a bridge between the child and parent experiences.

## Colors

The palette uses a "Wash of Calm" approach. Instead of saturated primary colors, this design system utilizes warm pastels and "muddy" neutrals to prevent eye strain and sensory meltdowns.

- **Primary (Friendly Green):** Used for "Success" states, progress, and growth-related elements.
- **Secondary (Pastel Yellow):** The warmth of the system, used for highlight areas and active categories.
- **Tertiary (Soft Blue):** Used for instructional elements and the "Parent Gate" interface.
- **Neutral (Cream Bone):** The base background color. Avoid pure white (#FFFFFF) to reduce glare; use `#FDFBF7` to create a paper-like, organic feel.
- **High Contrast:** Text labels must maintain a high contrast ratio against the pastel backgrounds for maximum legibility of Vietnamese diacritics.

## Typography

Typography is designed for pre-literate or early-literate children. **Be Vietnam Pro** is selected for its exceptional handling of Vietnamese diacritics, which are often crowded in other sans-serifs.

- **Word Focus:** The central word being learned should be rendered in the largest scale possible, using a heavy weight to ensure the child associates the sound with the visual glyph.
- **Readability:** All lowercase letters should have open counters.
- **Parental Mode:** Uses **Plus Jakarta Sans** to provide a slightly more structured, professional "dashboard" feel that distinguishes the administrative side from the learning side.

## Layout & Spacing

This design system uses a **Contextual Fluid Grid** that prioritizes the video/avatar asset.

- **Child Mode:** A single-column focus. The video area occupies 50-70% of the vertical height. Interactions are moved to the bottom third of the screen to accommodate shorter reach.
- **Hidden Navigation:** A "subtle handle" is positioned 12px from the bottom edge. This handle must be large enough to be discovered by a parent but low-contrast enough to be ignored by the child.
- **Parent Mode:** Switches to a 12-column fixed grid on tablet and a fluid list on mobile to handle data-heavy progress reports and video management.

## Elevation & Depth

To maintain a sensory-friendly environment, this design system avoids complex shadows and distracting blurs.

- **Tonal Layering:** Depth is communicated through color shifts rather than shadows. A "pressed" button simply becomes a darker shade of its pastel base.
- **Temporal Depth (Parent Gate):** When the parent holds the lock icon, a circular progress fill acts as the only "active" elevation change, signaling a transition between layers of the app.
- **Overlays:** Success states (stars/stickers) appear on a semi-transparent dimmed background (40% opacity) to keep the child’s focus on the reward without losing the context of the lesson.

## Shapes

The shape language is **Soft and Organic**. Sharp corners are strictly prohibited as they evoke a sense of "stiffness" or "danger" that contradicts the brand personality.

- **Cards:** Category cards for words (e.g., "Animals", "Family") use `rounded-lg` (1rem) to feel like physical flashcards.
- **Interactive Elements:** Buttons utilize a highly rounded profile, bordering on pill-shaped, to invite touch.
- **Containers:** Main video containers use a subtle 16px radius to soften the edges of the high-contrast video content.

## Components

### Buttons
- **Tactile Primary:** Minimum 48px height. High-contrast text on a `primary` or `secondary` background. No gradients.
- **Parent Gate Button:** A specialized component requiring a 1.0s long-press. Visual feedback is a radial border fill.

### Cards
- **Word Category Cards:** Large, centered illustration with a single label below. The background of the card should be a tinted version of the category color (e.g., `soft-green`).

### Navigation
- **Hidden Handle:** A horizontal bar (40px x 4px) with rounded ends, rendered in a low-contrast gray (#E0E0E0).
- **Parent Dashboard:** Uses standard list items with clear dividers to separate complex settings from progress charts.

### Input Fields (Parent Mode)
- **Soft Inputs:** Use a 2px solid border in a neutral tone. Focus states use the `primary-color` to provide clear feedback.

### Feedback Elements
- **Stickers/Stars:** Non-animated or slow-fading SVG elements. Avoid flickering or "shaking" animations.
- **Mouth Focus Video:** A centered, high-contrast video player with no visible controls; controls auto-hide to prevent the child from toggling settings mid-lesson.

---

## Codex Implementation Contract

This file is intended to let Codex implement KidEDU screens from page screenshots with minimal additional explanation. It defines the shared UI language, responsive rules, and visual QA process. Each page screenshot should be treated as a screen-specific visual reference, while this file remains the system-level contract.

### Source Priority

When Codex implements a screen from this design system and one or more screenshots, use this priority order:

1. **Existing codebase architecture and framework conventions** — do not replace the app architecture unless explicitly requested.
2. **Product and user-flow documents** — use them for screen purpose, route structure, user roles, and behavior.
3. **This design system** — use it for colors, typography, spacing scale, radius, accessibility, interaction rules, sensory-friendly behavior, and reusable component patterns.
4. **Attached page screenshot** — use it as the visual ground truth for layout order, proportions, hierarchy, alignment, spacing balance, active states, and visual density.
5. **Page-specific screen notes, when provided** — use them for copy, data, route name, edge cases, and exact states.

If the screenshot and this design system conflict, apply this rule:

- Use this design system for **global visual language**: color tokens, typography families, radius, motion limits, minimum touch targets, safe-area behavior, and sensory-friendly constraints.
- Use the screenshot for **screen-specific composition**: section order, card prominence, relative spacing, content density, icon placement, active tab, and visual hierarchy.

Do not invent a new design direction. Do not add decorative gradients, heavy shadows, noisy illustrations, flickering animations, or dense UI patterns that are not present in the screenshot or the design system.

### Screenshot Handling Rules

Page screenshots are visual references, not fixed-size implementation targets.

Codex must ignore all design-tool artifacts, including:

- blue selection borders,
- blue resize handles,
- red outer canvas borders,
- dotted editor backgrounds,
- exported frame-size labels such as `390 x 1249`,
- any Stitch/Figma/editor UI outside the real app frame.

Only implement the actual app content inside the selected frame.

The screenshot should be used to infer:

- component order,
- visual hierarchy,
- approximate spacing rhythm,
- card proportions,
- active/inactive states,
- icon scale,
- text hierarchy,
- section grouping,
- whether the page should scroll,
- bottom navigation state,
- visual density and warmth.

The screenshot should not be used to hardcode:

- a fixed `390px` app width,
- a fixed exported screenshot height,
- fixed card widths copied from Stitch,
- non-responsive absolute positions,
- editor-only borders or handles.

---

## Responsive Sizing & Normalization

### Reference Frame

The standard Stitch mobile screenshots use a **390px reference width**. Treat `390px` as the base visual reference where the implementation should match the screenshot most closely.

Do **not** hardcode the app to the exported screenshot dimensions.

For long exports such as `390 x 1249`, interpret them as:

- `390px` = reference mobile width,
- `1249px` = total scrollable content height in the design export,
- not the real viewport height of every phone.

The real app should use:

```css
min-height: 100dvh;
overflow-y: auto;
```

Parent Mode screens can be vertically scrollable. Child Mode screens should prioritize focus and may avoid scrolling when possible.

### Mobile App Shell

Use a constrained mobile app shell so the UI works across small phones, large phones, tablets, and desktop previews.

Recommended implementation:

```css
.kidedu-app-shell {
  width: 100%;
  max-width: 430px;
  min-height: 100dvh;
  margin-inline: auto;
  background: var(--background);
  position: relative;
}
```

Rules:

- On mobile, the app shell fills the available width.
- On large phones, the shell may expand up to `430px`.
- On tablet or desktop preview, the shell should be centered unless the screen intentionally switches to a tablet layout.
- Avoid `width: 390px` as a production rule.

### Content Padding

The reference screenshots typically use approximately `24px` horizontal padding at `390px` width. Use fluid padding so smaller phones do not feel cramped.

Recommended implementation:

```css
.kidedu-screen-content {
  padding-inline: clamp(16px, 6vw, 24px);
}
```

Rules:

- Small phones may reduce padding to `16–20px`.
- Standard 375–430px phones should visually match the screenshot closely.
- Cards should use `width: 100%` inside the content container.
- Do not use fixed card widths copied from the screenshot.

### Height Behavior

Do not copy exported screenshot height into code.

Recommended implementation:

```css
.kidedu-screen {
  min-height: 100dvh;
}

.kidedu-scroll-content {
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}
```

Rules:

- Use `min-height: 100dvh`, not fixed heights like `height: 1249px`.
- Let content define page height.
- Parent dashboards and settings pages should scroll when content exceeds the viewport.
- Important bottom content must not be hidden behind the bottom tab bar.

### Bottom Navigation & Safe Area

Bottom navigation should be fixed to the bottom of the mobile viewport when present in the screenshot.

Recommended implementation:

```css
.kidedu-bottom-tab-bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  padding-bottom: env(safe-area-inset-bottom);
}
```

Rules:

- Use `env(safe-area-inset-bottom)` for iPhone home indicators and other safe-area devices.
- Add enough bottom padding to scroll content so the last card or section is not covered.
- The active tab must match the screenshot.
- Active states should use soft tonal fills or pill backgrounds, not harsh color blocks.

### Breakpoints

Use these breakpoints unless the project already defines equivalent breakpoints:

| Range | Behavior |
|---|---|
| `320–374px` | Compact mobile. Single column. Reduce horizontal padding to `16–20px`. Allow text wrapping. Keep touch targets at least `48px`. |
| `375–430px` | Standard mobile. Match 390px Stitch screenshots most closely. Use approximately `24px` side padding. |
| `431–767px` | Large mobile / small tablet. Keep mobile layout, center app shell, optionally allow `max-width: 430–480px` if the screenshot feels cramped. |
| `768px+` | Tablet. Parent Mode may switch to wider dashboard layouts or a 12-column grid. Child Mode should remain focus-first and avoid unnecessary density. |

### Typography Scaling

Use design tokens as the base. Use `clamp()` only where text is large enough to break the layout on small screens.

Recommended examples:

```css
.parent-screen-title {
  font-size: clamp(18px, 5vw, 22px);
}

.parent-primary-metric {
  font-size: clamp(22px, 6vw, 28px);
}

.child-word-focus {
  font-size: clamp(36px, 10vw, 48px);
}
```

Rules:

- Vietnamese text must remain legible, including diacritics.
- Do not reduce body text below accessible mobile sizes.
- Avoid fixed widths that cause awkward Vietnamese line breaks.
- Parent Mode uses Plus Jakarta Sans unless the screen is intentionally child-facing.
- Child-facing learning text uses Be Vietnam Pro.

### Touch Targets

Every interactive element must be at least `48px` wide and `48px` tall.

This applies to:

- primary buttons,
- icon buttons,
- bottom tab items,
- cards that are tappable,
- parent gate controls,
- hidden handles,
- upload/add buttons,
- settings rows.

Do not scale touch targets below `48px` on small screens.

---

## Shared Parent Mode Screen System

Use this section when implementing the four Parent Mode screenshots or any dashboard/settings page for caregivers.

### Parent Mode Visual Language

Parent Mode should feel more structured than Child Mode, but it must still belong to the same KidEDU sensory-friendly world.

Rules:

- Use warm cream background from `background` / `surface`.
- Use Plus Jakarta Sans for dashboard labels, headings, data, and navigation.
- Use soft rounded cards, usually `rounded-lg` to `rounded-xl`.
- Prefer tonal layering over strong shadows.
- Avoid gradients.
- Avoid dense borders unless they are low contrast.
- Keep the interface calm, readable, and supportive.
- Use green for progress/success, yellow for warm highlights or video guidance, blue for tips/instruction, and soft red only for gentle review/error states.

### Parent Mode Mobile Layout

Default mobile structure:

```text
ParentModeScreen
- AppShell
  - ScrollContent
    - Header
    - PrimarySummaryCard
    - SectionBlock
    - SectionBlock
    - SupportingInfoCard
    - StatsGrid or List
  - BottomTabBar
```

Rules:

- Single column on mobile.
- Content should feel compact but not crowded.
- Use clear section titles.
- Use small secondary actions on the right side of section headers when present in the screenshot.
- Keep main summary/progress card as the strongest visual block if shown.
- Use a fixed bottom tab bar if the screenshot includes bottom navigation.

### Parent Header Pattern

A typical Parent Mode header includes:

- small status/brand icon,
- mode title such as `PHỤ HUYNH`,
- child name or context subtitle such as `Bé An`,
- optional notification or settings icon button.

Rules:

- Header icon buttons must be at least `48px` touch targets even if the visible icon is smaller.
- The title should be strong but not oversized.
- Subtitle should be smaller and lower emphasis.
- Header content should align with the screen content padding.

### Section Header Pattern

Use for dashboard groups such as results, videos, tips, reports, settings, or history.

Pattern:

```text
SectionHeader
- Title
- OptionalAction
```

Rules:

- Title uses medium or semibold weight.
- Optional action uses smaller text and clear tap target.
- Actions such as `Xem tất cả` or `+ Thêm mới` should not visually overpower the section title.

### Parent Dashboard Cards

Parent dashboard cards include progress cards, result cards, video guidance cards, tips, settings rows, and stats cards.

Rules:

- Use `width: 100%` inside the content container.
- Use `min-height` rather than fixed height when needed.
- Card padding should usually be `12–20px`, depending on screenshot density.
- Card radius should usually be `16–24px`.
- Use low or no shadow. If shadow is necessary, keep it subtle.
- Use tonal background colors to separate content areas.

### Progress / Summary Card

Use for the most important parent-facing metric on a dashboard screen.

Structure:

```text
ProgressSummaryCard
- Small label
- Large metric line
- Progress bar or status visual
- Supportive explanation
```

Rules:

- This is usually the strongest visual block on the screen.
- Use green or primary-container tones for positive progress.
- Text must remain high contrast.
- Progress bars should be calm and simple.
- Avoid animated progress unless slow and purposeful.

### Quick Result Card

Use for recent child learning results.

Structure:

```text
QuickResultCard
- Icon or small illustration
- Word/title
- Time label
- Status pills
```

Rules:

- Card background should be near-white or a low container tone.
- Status pills should be small, rounded, and readable.
- Positive status can use green.
- Neutral status can use soft surface tones.
- Review/needs-practice status can use `error-container` or a soft red tint, not harsh red.

### Parent Video Card

Use for parent-recorded video guidance or upload states.

Structure:

```text
ParentVideoCard
- Thumbnail/avatar/media preview
- Status icon or count
- Title/status text
- Short explanation
```

Rules:

- Yellow or secondary-container tones are appropriate for warm guidance.
- Do not make warning states feel alarming unless there is a true error.
- Media thumbnails should be softly rounded.
- Copy should be brief and supportive.

### Parent Tip Card

Use for coaching tips and at-home practice suggestions.

Rules:

- Blue, gentle-blue, or low-contrast container tones are appropriate.
- A subtle border, dashed border, or tonal layer may be used if the screenshot shows it.
- Tip text should be short and practical.
- Avoid dense educational paragraphs inside small cards.

### Parent Stats Grid

Use for compact metrics such as streak, learned words, sessions, or videos.

Rules:

- On mobile, use two equal-width columns when the screenshot shows paired stats.
- Stats cards should be lower visual emphasis than the primary progress card.
- Number should be visually stronger than label.
- Keep labels concise.

### Bottom Tab Bar

Use when the screenshot includes persistent navigation.

Common KidEDU tabs:

```text
Học | Phụ huynh | Cài đặt
```

Rules:

- The active tab must match the screenshot.
- Active tab can use a green pill background.
- Inactive tabs use simple icon + label.
- Keep labels short.
- Keep touch targets at least `48px`.
- Apply safe-area padding.

---

## Page Screenshot Handoff Workflow

When a new page screenshot is added, Codex should follow this workflow.

### Step 1 — Identify the App Frame

Locate the real app content inside the screenshot. Ignore editor UI, borders, handles, canvas labels, and any content outside the selected app frame.

### Step 2 — Determine Screen Type

Classify the page:

- Child Mode learning screen,
- Child Mode category/word selection,
- Parent Gate,
- Parent Mode dashboard,
- Parent Mode results/history,
- Parent Mode video management,
- Parent Mode settings,
- loading/empty/error state.

### Step 3 — Convert Screenshot Into Component Tree

Infer a reusable component tree from the screenshot instead of writing static markup.

Example:

```text
Screen
- Header
- SummaryCard
- Section
  - SectionHeader
  - CardList
- SupportingCard
- BottomNavigation
```

### Step 4 — Implement Responsive Layout

Implement the screen using:

- `width: 100%`,
- constrained app shell,
- fluid padding,
- reusable tokens,
- `min-height: 100dvh`,
- scroll when needed,
- safe-area handling for fixed bottom navigation.

### Step 5 — Visual Verification

After implementation, run the app and visually compare at these widths:

- `390px` — must match the Stitch screenshot most closely,
- `360px` — must remain usable on compact phones,
- `414px` or `430px` — must remain balanced on larger phones,
- `768px` — must not break on tablet preview.

Check:

- section order,
- active tab,
- header alignment,
- card width,
- card radius,
- horizontal padding,
- vertical gaps,
- font sizes,
- text wrapping,
- icon sizes,
- bottom nav safe area,
- scroll behavior,
- absence of editor artifacts.

### Step 6 — Iterate

If the rendered UI does not match the screenshot, adjust in this order:

1. app shell width and padding,
2. section spacing,
3. card padding and radius,
4. font size and weight,
5. icon size and placement,
6. bottom navigation height and active state,
7. colors and tonal backgrounds.

Avoid changing the global visual language just to solve a single page unless the screenshot clearly establishes a reusable pattern.

---

## Screen Specification Template

Use this template only when additional page notes are needed. If a screenshot is clear enough, attaching the screenshot plus this design system may be sufficient.

```md
# Screen: [Screen Name]

Reference Screenshot:
- File: [screenshot-file-name.png]
- Reference width: [390px unless otherwise stated]
- Exported height: [treat as scrollable content height]

Mode:
- [Child Mode / Parent Mode / Parent Gate]

Route:
- [e.g. /parent, /parent/results, /learn]

Purpose:
- [One sentence describing what the user should understand or do on this screen.]

Implementation Notes:
- Ignore Stitch/Figma editor UI artifacts.
- Use the screenshot as visual ground truth.
- Use this design system for tokens, components, responsive behavior, and accessibility.
- Do not hardcode exported dimensions.

Component Tree:
- [ScreenComponent]
  - [Header]
  - [PrimaryCard]
  - [Section]
  - [BottomTabBar if present]

Content:
- [List exact text only when needed.]

Behavior:
- [Scrollable/fixed bottom nav/long press/upload/etc.]

Responsive Notes:
- Match screenshot at 390px.
- Remain usable from 320px to 430px.
- Define tablet behavior if different.

Acceptance Criteria:
- [ ] Matches screenshot composition at 390px.
- [ ] No editor artifacts are implemented.
- [ ] Uses reusable components.
- [ ] Uses design tokens from this file.
- [ ] Uses responsive layout, not fixed screenshot dimensions.
- [ ] Touch targets are at least 48px.
- [ ] Bottom navigation respects safe area when present.
```

---

## Recommended File Naming For Screenshots

Use predictable names so Codex can infer page purpose from the file name.

```text
/screenshots/parent-01-home.png
/screenshots/parent-02-results.png
/screenshots/parent-03-videos.png
/screenshots/parent-04-settings.png
/screenshots/child-01-learning.png
/screenshots/child-02-categories.png
/screenshots/child-03-parent-gate.png
```

For four Parent Mode screenshots, use:

```text
parent-01-home.png
parent-02-results.png
parent-03-videos.png
parent-04-settings.png
```

Keep screenshots uncropped where possible. Margins, safe areas, and bottom navigation spacing are important for visual matching.

---

## Codex Prompt Template

Use this prompt when asking Codex to implement a page from screenshots.

```text
Read docs/kidedu-parent-mode-ui-spec.md first. It is the KidEDU shared UI design system and implementation contract. If the file is saved as docs/design.md in the repo, use that path instead.

Use the attached screenshot(s) as page-specific visual references.

Important:
- Ignore Stitch/Figma editor UI artifacts such as blue borders, handles, red outlines, dotted backgrounds, and exported size labels.
- The screenshot width is a reference, usually 390px. Do not hardcode the app to 390px width or to the exported screenshot height.
- Implement a responsive mobile-first UI using the design tokens, typography, radius, spacing, component rules, and sensory-friendly constraints from the design system file.
- Use reusable components. Do not create one-off static HTML.
- Match the screenshot most closely at 390px width.
- Keep the UI usable from 320px to 430px and safe on tablet previews.
- Use min-height: 100dvh, scrollable content where needed, and safe-area padding for fixed bottom navigation.

Implementation workflow:
1. Identify the real app frame inside the screenshot.
2. Convert the screenshot into a reusable component tree.
3. Implement the screen in the existing codebase style.
4. Run the app.
5. Capture or inspect the rendered result at 390px width.
6. Compare with the reference screenshot.
7. Adjust spacing, radius, font sizes, card heights, and navigation until it visually matches.
```

---

## Visual Matching Acceptance Checklist

Before considering a screenshot-based implementation complete, verify:

- [ ] The rendered page matches the screenshot most closely at `390px` width.
- [ ] The app is not fixed to `390px` in production.
- [ ] Exported screenshot height is not hardcoded.
- [ ] Content scrolls naturally when longer than the viewport.
- [ ] Bottom navigation, if present, is fixed and safe-area aware.
- [ ] The active tab matches the screenshot.
- [ ] All cards use soft radius and tonal layering.
- [ ] No harsh gradients, heavy shadows, flicker, or noisy decoration is introduced.
- [ ] Touch targets are at least `48px`.
- [ ] Vietnamese text remains legible and does not wrap awkwardly.
- [ ] The implementation uses reusable components.
- [ ] The code follows existing project conventions.
- [ ] Stitch/Figma editor artifacts are not implemented.

