# Cerebro Personal — Design System

## Overview

Cerebro Personal is a personal productivity assistant built with React 18 + Vite 5. The UI is entirely inline-styled (no CSS framework), following a macOS/Apple-inspired aesthetic with two themes: **Light** and **Dark**.

---

## Brand Identity

- **App name:** Cerebro Personal
- **Logo mark:** layered-diamond SVG icon (24×24), white stroke
- **Logo container:** 36×36 px, `border-radius: 10px`, gradient `linear-gradient(135deg, #0071e3, #5e5ce6)`
- **Personality:** Clean, professional, calm — productivity tool for an engineer

---

## Color Tokens

### Light Theme

| Token | Hex / Value | Usage |
|---|---|---|
| `bg` | `#f0f0f5` | Page background |
| `surface` | `#ffffff` | Cards, panels |
| `surfaceHigh` | `rgba(255,255,255,0.95)` | Floating overlays, modals |
| `border` | `rgba(0,0,0,0.08)` | Default borders |
| `borderHigh` | `rgba(0,0,0,0.15)` | Emphasized borders |
| `accent` | `#0071e3` | Primary action, links, focus ring |
| `accentSoft` | `rgba(0,113,227,0.07)` | Accent chip backgrounds |
| `accentGlow` | `rgba(0,113,227,0.18)` | Accent hover glow |
| `teal` | `#24b495` | Secondary accent (calendar, meetings) |
| `tealSoft` | `rgba(36,180,149,0.07)` | Teal chip backgrounds |
| `tealGlow` | `rgba(36,180,149,0.18)` | Teal hover glow |
| `amber` | `#ff9500` | Warnings, due dates, "today" |
| `amberSoft` | `rgba(255,149,0,0.07)` | Amber chip backgrounds |
| `amberGlow` | `rgba(255,149,0,0.18)` | Amber hover glow |
| `coral` | `#ff3b30` | Errors, urgent, delete, expenses |
| `coralSoft` | `rgba(255,59,48,0.07)` | Coral chip backgrounds |
| `coralGlow` | `rgba(255,59,48,0.18)` | Coral hover glow |
| `green` | `#34c759` | Success, income, completed |
| `greenSoft` | `rgba(52,199,89,0.07)` | Green chip backgrounds |
| `greenGlow` | `rgba(52,199,89,0.18)` | Green hover glow |
| `purple` | `#5e5ce6` | AI features, notes, secondary brand |
| `purpleSoft` | `rgba(94,92,230,0.07)` | Purple chip backgrounds |
| `textPrimary` | `#1d1d1f` | Headings, primary body text |
| `textSecondary` | `#515154` | Secondary body text |
| `textTertiary` | `#86868b` | Captions, placeholders, disabled |

### Dark Theme

| Token | Hex / Value | Usage |
|---|---|---|
| `bg` | `#0f0f14` | Page background |
| `surface` | `#1a1a24` | Cards, panels |
| `surfaceHigh` | `#22222e` | Floating overlays, modals |
| `border` | `rgba(255,255,255,0.08)` | Default borders |
| `borderHigh` | `rgba(255,255,255,0.14)` | Emphasized borders |
| `accent` | `#0a84ff` | Primary action |
| `accentSoft` | `rgba(10,132,255,0.18)` | Accent chip backgrounds |
| `accentGlow` | `rgba(10,132,255,0.3)` | Accent hover glow |
| `teal` | `#5ac8fa` | Secondary accent |
| `tealSoft` | `rgba(90,200,250,0.15)` | Teal chip backgrounds |
| `tealGlow` | `rgba(90,200,250,0.25)` | Teal hover glow |
| `amber` | `#ff9f0a` | Warnings, due dates |
| `amberSoft` | `rgba(255,159,10,0.15)` | Amber chip backgrounds |
| `amberGlow` | `rgba(255,159,10,0.25)` | Amber hover glow |
| `coral` | `#ff453a` | Errors, urgent, delete |
| `coralSoft` | `rgba(255,69,58,0.15)` | Coral chip backgrounds |
| `coralGlow` | `rgba(255,69,58,0.25)` | Coral hover glow |
| `green` | `#30d158` | Success, income, completed |
| `greenSoft` | `rgba(48,209,88,0.15)` | Green chip backgrounds |
| `greenGlow` | `rgba(48,209,88,0.25)` | Green hover glow |
| `purple` | `#bf5af2` | AI features, notes |
| `purpleSoft` | `rgba(191,90,242,0.15)` | Purple chip backgrounds |
| `textPrimary` | `#f5f5f7` | Headings, primary body text |
| `textSecondary` | `#aeaeb2` | Secondary body text |
| `textTertiary` | `#636366` | Captions, placeholders, disabled |

---

## Typography

### Font Families

| Role | Family |
|---|---|
| **Body / UI** | `Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `sans-serif` |
| **Display / Headings** | `Outfit` (weights 400–900) |
| **System fallback** | `-apple-system`, `BlinkMacSystemFont`, `"SF Pro Display"`, `sans-serif` |

### Type Scale

| Usage | Size | Weight |
|---|---|---|
| Section label / eyebrow | `10px` | `700`, `letter-spacing: 0.08em`, `text-transform: uppercase` |
| Caption / metadata | `10.5–11px` | `400–500` |
| Body small | `12px` | `400–500` |
| Body | `13px` | `400–500` |
| Body medium | `14–15px` | `500–600` |
| Card title | `15px` | `700` |
| Subheading | `17–18px` | `700` |
| Page heading | `26px` | `800`, `letter-spacing: -0.03em` |

---

## Spacing & Layout

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (220px fixed)  │  Main content area (flex: 1)  │  AI Sidebar (300px, slide-in) │
└─────────────────────────────────────────────────────────┘
```

- **Sidebar width:** `220px` fixed, always dark (`#16161e`) regardless of theme
- **Sidebar border:** `1px solid rgba(255,255,255,0.06)`
- **AI Sidebar width:** `300px`, slides in from the right
- **Page padding:** `24px` (desktop), `16px` (mobile)
- **Card gap:** `20px` (grid), `12–16px` (list)
- **Scrollbar:** `4px` wide, transparent track, `rgba(0,0,0,0.12)` thumb

### Border Radius Scale

| Usage | Radius |
|---|---|
| Small chips / tags | `12px` or `99px` (pill) |
| Buttons | `14px` |
| Small cards | `14–16px` |
| Medium cards / modals | `20–24px` |
| Large overlays / drawers | `24px` |
| Avatars / icons | `50%` (circle) or `8–10px` (squircle) |

### Shadow / Elevation

| Level | Value |
|---|---|
| Subtle | `0 2px 8px rgba(0,0,0,0.06)` |
| Card hover | `0 4px 16px rgba(0,0,0,0.08)` |
| Accent glow | `0 4px 10px rgba(0,113,227,0.15)` |
| Floating modal | `0 20px 60px rgba(0,0,0,0.3)` |
| Danger button | `0 2px 6px rgba(255,45,85,0.25)` |
| Primary CTA | `0 4px 12px rgba(0,113,227,0.25)` |

---

## Components

### Card

- Background: `surface`
- Border: `1px solid border`
- Border-radius: `24px`
- Padding: `20–24px`
- Optional glow on hover via `glowColor` prop
- Transition: `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`

### Badge / Chip

```
padding: 2px 8px
border-radius: 99px (pill)
font-size: 11px
font-weight: 600–700
letter-spacing: 0.02em
border: 1px solid {color}33
background: {color}Soft token
```

### Primary Button

```
background: accent (#0071e3 light / #0a84ff dark)
color: #ffffff
border-radius: 14px
padding: 9–10px 18–20px
font-size: 13px
font-weight: 600
box-shadow: 0 4px 12px rgba(0,113,227,0.25)
transition: all 0.2s
```

### Destructive / Alert Button

```
background: coral (#ff3b30 light / #ff453a dark)
color: #ffffff
box-shadow: 0 2px 6px rgba(255,45,85,0.25)
```

### Glass Input

```
background: rgba(255,255,255,0.85)
backdrop-filter: blur(20px)
border: 1px solid rgba(0,0,0,0.08)
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
:focus-within → border: accent, box-shadow: 0 0 18px rgba(0,113,227,0.15)
```

### Scrollbar (custom)

```
width: 4px
track: transparent
thumb: rgba(0,0,0,0.12), border-radius: 2px
```

---

## Navigation

### Sidebar Nav Items

| ID | Label | Icon (Feather-style) |
|---|---|---|
| `inicio` | Inicio | Home |
| `tareas` | Tareas | Check-square |
| `notas` | Notas | File-text |
| `calendario` | Calendario | Calendar |
| `reuniones` | Reuniones | Video |
| `finanzas` | Finanzas | Bar-chart-2 |
| `contactos` | Contactos | Users |
| `correos` | Correos | Mail |

### Nav Item Style

```
display: flex, align-items: center, gap: 10px
padding: 9px 14px
border-radius: 10px
font-size: 13px
font-weight: 500
color: rgba(255,255,255,0.5) (inactive)
color: #ffffff (active)
background: rgba(255,255,255,0.08) (active)
transition: all 0.2s
```

---

## Animations

| Name | Description |
|---|---|
| `fadeIn` | `opacity 0→1` + `translateY 8px→0`, 0.4s ease |
| `slideIn` | `opacity 0→1` + `translateX -12px→0`, 0.3s ease |
| `slideInSidebar` | AI sidebar slide from right, 0.32s `cubic-bezier(0.16,1,0.3,1)` |
| `pulse` | opacity 1↔0.5 loop — loading states |
| `spin` | 360° rotation — spinner |
| `ripple` | scale 1→2.5, opacity 0.3→0 — tap feedback |
| `floatOrb` | translateY 0↔-4px + scale 1↔1.02, 3s loop — AI orb idle |
| `glowPulse` | box-shadow blue↔purple, 2s loop — AI orb thinking |
| `glowPulseListening` | box-shadow red↔orange + scale 1↔1.08, 1.5s loop — AI orb listening |
| `floatingTag1/2/3` | subtle float + rotation, offset phase — tag decorations |

---

## Views / Screens

| View | Primary accent | Key UI patterns |
|---|---|---|
| Dashboard (`inicio`) | `accent` (blue) | 2-col grid, cards, agenda list, task progress |
| Tareas | `amber` + `green` | Filter chips (Hoy/Semana/Completado), task rows with priority badges |
| Notas | `purple` | Block-based editor, slash commands, image picker |
| Calendario | `teal` | Month grid, event dots, day detail drawer |
| Reuniones | `teal` | Meeting cards, agenda view |
| Finanzas | `green` + `coral` | Account cards (PIN-gated), movement drawer, consolidated report |
| Contactos | `accent` | Contact list with avatar initials |
| Correos | `accent` | Tab bar (Primario / Social / Actualizaciones / Promociones), email rows with AI summary |

---

## AI Orb

The primary AI interaction element — a circular gradient orb in the bottom of the left sidebar.

- **Size:** 52×52 px
- **Shape:** Perfect circle
- **Gradient (idle):** `linear-gradient(135deg, #0071e3 0%, #5e5ce6 50%, #6e00f5 100%)`
- **Inner highlight:** `rgba(255,255,255,0.6)` top-half overlay
- **Glow shadow (idle):** `0 0 15px rgba(0,113,227,0.2)`
- **State — Listening:** Red/orange glow, scale pulses 1→1.08
- **State — Thinking:** Blue/cyan glow
- **Animation:** `floatOrb` (continuous float) + `glowPulse` (state-driven)

---

## Semantic Color Usage

| Meaning | Color token |
|---|---|
| Income / positive balance | `green` |
| Expense / negative balance | `coral` |
| Warning / due soon | `amber` |
| Info / primary action | `accent` (blue) |
| AI / intelligent features | `purple` |
| Meetings / calendar | `teal` |
| Locked / security | `textTertiary` + `🔒` |
| Unread indicator | `accent` dot |
| High priority | `coral` |
| Medium priority | `amber` |
| Low priority | `green` |

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `> 900px` | Full sidebar visible, 2-col dashboard grid |
| `≤ 900px` | Sidebar hidden, hamburger menu button |
| `≤ 860px` | Dashboard grid collapses to 1 column |

Mobile sidebar slides in from left (`translateX(-100%)` → `translateX(0)`), overlaid with a dark scrim.

---

## Glassmorphism Pattern

Used in floating panels, modals, and the AI chat sidebar:

```css
background: rgba(255,255,255,0.85)       /* light */
background: rgba(30,30,40,0.92)          /* dark */
backdrop-filter: blur(20px)
-webkit-backdrop-filter: blur(20px)
border: 1px solid rgba(255,255,255,0.12) /* dark variant */
```

---

## Radial Background Glow

Subtle ambient glow placed absolutely behind main content:

```css
background:
  radial-gradient(circle at 20% 30%, rgba(0,113,227,0.03) 0%, transparent 40%),
  radial-gradient(circle at 80% 70%, rgba(255,149,0,0.02) 0%, transparent 40%);
pointer-events: none;
mix-blend-mode: multiply;
```
