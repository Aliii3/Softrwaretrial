---
version: alpha
name: Study Buddy System
description: >
  A calm, focused, and collaborative design system for matching students,
  scheduling study sessions, and managing academic preferences across a
  GraphQL microservices platform.

colors:
  # Brand — primary
  primary: "#2563EB"
  on-primary: "#FFFFFF"
  primary-container: "#DBEAFE"
  on-primary-container: "#1E3A8A"

  # Brand — secondary (collaboration / availability)
  secondary: "#0F766E"
  on-secondary: "#FFFFFF"
  secondary-container: "#CCFBF1"
  on-secondary-container: "#134E4A"

  # Brand — tertiary (reminders / pending / warmth)
  tertiary: "#F59E0B"
  on-tertiary: "#1F2937"
  tertiary-container: "#FEF3C7"
  on-tertiary-container: "#78350F"

  # Semantic — success
  success: "#16A34A"
  on-success: "#FFFFFF"
  success-container: "#DCFCE7"
  on-success-container: "#14532D"

  # Semantic — warning
  warning: "#D97706"
  on-warning: "#FFFFFF"
  warning-container: "#FEF3C7"
  on-warning-container: "#78350F"

  # Semantic — error
  error: "#DC2626"
  on-error: "#FFFFFF"
  error-container: "#FEE2E2"
  on-error-container: "#7F1D1D"

  # Neutrals — surfaces and text
  background: "#F8FAFC"
  on-background: "#0F172A"
  surface: "#FFFFFF"
  on-surface: "#0F172A"
  surface-muted: "#F1F5F9"
  on-surface-muted: "#475569"
  surface-accent: "#EFF6FF"
  on-surface-accent: "#1E3A8A"

  # Borders and outlines
  border: "#E2E8F0"
  border-strong: "#CBD5E1"
  outline: "#94A3B8"

  # Inverse and overlay
  inverse-surface: "#0F172A"
  inverse-on-surface: "#F8FAFC"
  overlay: "#020617"

  # Interactive
  focus-ring: "#60A5FA"

typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 800
    lineHeight: 56px
    letterSpacing: 0em

  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 700
    lineHeight: 40px
    letterSpacing: 0em

  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 700
    lineHeight: 32px
    letterSpacing: 0em

  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: 0em

  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 26px
    letterSpacing: 0em

  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0em

  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0em

  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0em

  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0em

  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0em

  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.02em

  data-md:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0em

  data-sm:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0em

spacing:
  unit: 8px
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 48px
  page-margin-mobile: 16px
  page-margin-desktop: 32px
  content-max-width: 1200px

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

elevation:
  none: "none"
  low: "0 1px 2px 0 rgba(15, 23, 42, 0.05)"
  medium: "0 8px 24px -12px rgba(15, 23, 42, 0.18)"
  high: "0 24px 48px -24px rgba(15, 23, 42, 0.25)"

shadows:
  focus: "0 0 0 3px rgba(96, 165, 250, 0.35)"
  card: "0 8px 24px -12px rgba(15, 23, 42, 0.18)"
  popover: "0 24px 48px -24px rgba(15, 23, 42, 0.25)"

motion:
  duration-fast: 120ms
  duration-standard: 180ms
  duration-slow: 280ms
  easing-standard: "cubic-bezier(0.2, 0, 0, 1)"
  easing-emphasized: "cubic-bezier(0.16, 1, 0.3, 1)"

components:
  # Shell
  app-shell:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    typography: "{typography.body-md}"

  top-nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    borderBottom: "{colors.border}"
    height: 64px
    padding: "0 24px"
    elevation: "{elevation.low}"

  side-nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    activeTextColor: "{colors.primary}"
    activeBackgroundColor: "{colors.primary-container}"
    width: 280px
    padding: 24px

  # Buttons
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    hoverBackgroundColor: "{colors.on-primary-container}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 44px
    padding: "10px 16px"
    elevation: "{elevation.none}"

  button-secondary:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    hoverBackgroundColor: "{colors.secondary}"
    hoverTextColor: "{colors.on-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 44px
    padding: "10px 16px"

  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    hoverBackgroundColor: "{colors.primary-container}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 40px
    padding: "8px 12px"

  # Cards
  card-standard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: 24px
    elevation: "{elevation.low}"

  card-highlight:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.on-surface-accent}"
    borderColor: "{colors.primary-container}"
    rounded: "{rounded.lg}"
    padding: 24px
    elevation: "{elevation.low}"

  card-match:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.border}"
    accentColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 24px
    elevation: "{elevation.medium}"

  # Form controls
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    placeholderColor: "{colors.on-surface-muted}"
    borderColor: "{colors.border}"
    focusBorderColor: "{colors.primary}"
    focusRing: "{shadows.focus}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 44px
    padding: "10px 12px"

  select-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.border}"
    focusBorderColor: "{colors.primary}"
    focusRing: "{shadows.focus}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 44px
    padding: "10px 12px"

  # Badges / chips
  badge-course:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  badge-availability:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  badge-pending:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  badge-success:
    backgroundColor: "{colors.success-container}"
    textColor: "{colors.on-success-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  badge-error:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  # Specialised data display
  match-score:
    backgroundColor: "{colors.success-container}"
    textColor: "{colors.on-success-container}"
    typography: "{typography.data-md}"
    rounded: "{rounded.md}"
    padding: "8px 10px"

  calendar-slot:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"

  calendar-slot-pending:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"

  # Notifications
  notification-unread:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.on-surface}"
    borderLeftColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px

  notification-read:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    rounded: "{rounded.md}"
    padding: 12px

  # Dialog / modal
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    overlayColor: "{colors.overlay}"
    rounded: "{rounded.xl}"
    padding: 32px
    elevation: "{elevation.high}"

  # Dividers
  divider:
    color: "{colors.border}"
    thickness: 1px
---

## Overview

Study Buddy System should feel **calm, capable, and quietly social**. It is an academic productivity product, not a social network or marketing site: the interface must prioritize quick scanning, clear state, and low-friction decisions around profile setup, availability management, peer matching, notifications, and study sessions.

The visual identity blends a focused blue academic core with teal collaboration accents and a small amount of amber warmth for reminders, time-sensitive cues, and pending states. The product should feel trustworthy enough to hand over scheduling and identity details, yet friendly enough that a student feels they are joining a study rhythm rather than configuring enterprise software.

## Color

The palette is intentionally **light, crisp, and high-contrast**. The default screen should read as mostly slate-on-white and soft blue, with saturated color reserved for action, emphasis, and status — never decoration.

**Primary blue (`#2563EB`)** is the strongest signal on any screen. Use it for the main call to action, active navigation items, key links, and the highest-confidence match emphasis. Avoid diluting it by applying it to more than one or two elements per view.

**Teal (`#0F766E`)** carries the semantics of collaboration, availability, and scheduling confidence. Calendar slots, partner status indicators, and session-ready states live in this family. The teal container (`#CCFBF1`) is a calm, readable background for availability blocks without competing with primary blue.

**Amber (`#F59E0B`)** signals reminders, pending actions, scheduling friction, and lightweight warnings. It should appear only when a student needs to act or when something is waiting on them — not as a general accent. Amber on large surfaces reads as caution; keep it to badges, chips, and inline alerts.

**Slate neutrals** (`#F8FAFC` background, `#0F172A` on-surface) form the foundation. Keep surfaces bright and uncluttered. Use `surface-muted` (`#F1F5F9`) for secondary panels and grouped form sections. Use `surface-accent` (`#EFF6FF`) for highlighted, guided, or active areas such as unread notification rows or selected preference groups.

**Semantic states** (success, warning, error) should use container variants for inline badges and field feedback before reaching for full-strength fills. Reserve strong fills for toasts and critical blocking errors.

## Typography

**Inter** is the sole interface typeface. It is neutral, legible, and comfortable for dense product screens at both body and label sizes. The tone should be precise but approachable: headings are sturdy, body copy is regular, and labels carry enough weight to anchor form rows and card metadata without feeling heavy.

**IBM Plex Mono** is reserved for compact structured values: match percentages, time ranges, session IDs, and scheduling metadata. It should never appear in long prose, navigation, or empty states. Its role is to visually distinguish "data" from "language."

Headlines should be clear and pragmatic. Avoid oversized editorial type except on onboarding screens or true empty states. In every day app views — the match feed, availability grid, notification list, session log — keep typographic hierarchy compact so students can compare courses, topics, times, and matches without scrolling past their own context.

Font weights follow the standard CSS numeric scale: 400 (regular), 500 (medium, monospace only), 600 (semibold, labels and titles), 700 (bold, headlines), 800 (extrabold, display). The label family at 600 is the workhorse for scannable UI text.

## Layout

The layout follows an **8 px rhythm** with restrained density. Pages use a full-width app shell, a persistent navigation area when viewport width allows, and a centered content region capped at **1200 px** for dashboards and forms.

Repeated, discrete objects — study sessions, recommended matches, notification rows, availability blocks, preference groups — live inside **cards**. Do not nest cards inside cards. For page-level structure, prefer open sections, tonal bands, and dividers over nested containment.

On **mobile** (< 768 px), collapse into a single-column flow with 16 px margins. Navigation should move to a bottom bar or drawer. Touch targets for scheduling and preference toggles must be at least 44 px tall.

On **desktop** (≥ 1024 px), two-column layouts are appropriate for pairing primary work with supporting context: match recommendations alongside profile completeness, or availability input alongside an upcoming-sessions summary. Keep secondary columns narrower (roughly 320–360 px) so the primary content area dominates.

## Elevation & Depth

Depth is quiet and functional. Most hierarchy comes from spacing, border contrast, and tonal surface differences — not from shadows.

Use shadows only when an element must visually separate from the page: cards hovering over a background, dropdown menus, dialogs, popovers, and explicitly lifted hover states. Standard cards use `elevation.low` with a subtle border. Modals and popovers use `elevation.high`, but they should still feel lightweight — not dramatic. Avoid blurred backgrounds, layered drop shadows, glass effects, or decorative gradients.

Focus rings use a soft blue glow (`shadows.focus`) at 3 px spread so keyboard navigation is unmistakable without being jarring.

## Shape

The shape language is **friendly but disciplined**. A consistent corner family across all controls on a screen is the rule; mixing very round and very sharp elements should be rare and intentional.

- **8 px** (`rounded.md`): buttons, text inputs, select fields, inline alerts — the standard interactive radius.
- **12 px** (`rounded.lg`): standard and highlight cards, notification rows, grouped panels.
- **16 px** (`rounded.xl`): modals, dialogs, larger feature panels.
- **6 px** (`rounded.sm`): calendar slots and compact metadata chips, so dense scheduling views stay tidy.
- **Full** (`rounded.full`): course badges, availability badges, match-score pills — purely categorical tags.
- **4 px** (`rounded.xs`): compact utility chips where space is tight.

## Motion

Transitions should be fast enough to feel responsive but slow enough to feel intentional.

- **120 ms / `easing-standard`**: micro-interactions — button press, checkbox toggle, badge swap.
- **180 ms / `easing-standard`**: content transitions, tab switches, inline feedback appearing.
- **280 ms / `easing-emphasized`**: important element entrances — dialogs opening, match cards sliding in, empty-state illustrations appearing.

Never animate background color changes on large layout regions. Reserve motion for the element that changed, not the entire page.

## Components

### Navigation

The **top navigation bar** (64 px tall, `surface` background, `elevation.low`) anchors the app and carries the product logo, current-context title, and a compact notification badge. It should stay fixed at the top of the viewport.

The **side navigation** (280 px, `surface` background) holds primary destinations: Dashboard, Matches, Availability, Sessions, and Notifications. The active item uses `primary-container` background with `primary`-colored text and a left accent bar. Inactive items use `on-surface-muted` text. On mobile this panel collapses.

### Buttons

**Primary buttons** (blue, 44 px tall) are reserved for the single most important next action on a screen: Save Profile, Find Matches, Confirm Session, Submit Availability. Use at most one per view section.

**Secondary buttons** (teal container, 44 px tall) are for collaborative or scheduling actions that are important but not the primary path: Add Co-student, Join Session, Mark Available.

**Ghost buttons** (transparent, 40 px tall, blue text) handle quiet supporting actions: Cancel, Edit, View Details. They must not compete visually with a primary or secondary button nearby.

### Cards

**Standard cards** (`surface`, `border`, `elevation.low`, 12 px radius) are the default unit for sessions, preferences, and notification detail panels.

**Highlight cards** (`surface-accent`, `primary-container` border, 12 px radius) call attention to guided actions: onboarding steps, incomplete profile prompts, recommended next-session suggestions.

**Match cards** add a subtle left-edge accent in `primary` color to distinguish them from session or notification cards at a glance. The match score component (IBM Plex Mono, `success-container` background) sits in the card header, not as a large decorative number.

### Forms

Profile and preference controls should feel **form-like and orderly**. Group related inputs by section: Basic Info, Courses & Topics, Study Style, Availability, and Preferences. Use fieldset-style dividers between groups. Keep helper text one line — if it needs more, the label is probably unclear.

Multi-select course chips use `badge-course` styling. When selected, they visually invert or gain a `primary` border to show state. Never rely on color alone; pair with a checkmark icon or bold text.

### Availability Grid

The availability grid is one of the most information-dense views. Calendar slots for **available** times use `secondary-container` fill. **Pending** slots (waiting on confirmation from a match) use `tertiary-container`. **Booked** slots use `primary-container`. Each slot shows a compact time range in `data-sm` (IBM Plex Mono) for precision. Grid rows are days; columns are hour blocks or half-hour blocks depending on viewport.

### Match Feed

Match cards should make five things instantly readable: the matched student's name and avatar, the **match score**, the **shared courses**, the **overlapping availability**, and the **primary reason for the match**. Supporting detail (full availability breakdown, topic overlap, study-style compatibility) lives behind a "View Details" ghost button or an expansion. Do not front-load cards with secondary information.

### Notifications

Notification rows are compact (12 px padding, `rounded.md`). Unread rows use `surface-accent` background with a 3 px `primary`-colored left border. Read rows use the default `surface` background and `on-surface-muted` text. The unread indicator must be a visual shape or border — never color alone.

## Do's and Don'ts

**Do:**
- Keep screens calm, bright, and scannable.
- Reserve saturated blue for the most important action or active state on a given screen.
- Use teal for all collaboration and availability semantics.
- Display match reasons and scheduling conflicts in legible, labeled form — not as decorative percentage rings.
- Ensure every interactive element has a visible focus state.
- Maintain 44 px minimum touch targets for scheduling and preference controls.

**Don't:**
- Use dark dashboards, glassmorphism, neon gradients, or playful classroom illustrations as the core visual language.
- Nest cards inside other cards.
- Rely on color alone for status — always pair with a label, icon, or accessible copy.
- Use amber as a general accent. Reserve it strictly for reminders, pending states, and time-sensitive warnings.
- Apply IBM Plex Mono outside of compact data values.
- Crowd a single screen with more than one primary button.
