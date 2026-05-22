---
name: Cerebro Obsidian-Crimson
colors:
  surface: '#0f1423'
  surface-dim: '#0b0e1a'
  surface-bright: '#1a1f35'
  surface-container-lowest: '#05060c'
  surface-container-low: '#0a0d17'
  surface-container: '#0f1423'
  surface-container-high: '#151b2f'
  surface-container-highest: '#1b233c'
  on-surface: '#f8fafc'
  on-surface-variant: '#94a3b8'
  inverse-surface: '#f8fafc'
  inverse-on-surface: '#0f172a'
  outline: '#384562'
  outline-variant: '#1e293b'
  surface-tint: '#3b82f6'
  primary: '#1F3A52'
  on-primary: '#ffffff'
  primary-container: '#2d5475'
  on-primary-container: '#ffffff'
  inverse-primary: '#901B2F'
  secondary: '#8B5CF6'
  on-secondary: '#ffffff'
  secondary-container: '#7c3aed'
  on-secondary-container: '#ffffff'
  tertiary: '#901B2F'
  on-tertiary: '#ffffff'
  tertiary-container: '#a82239'
  on-tertiary-container: '#ffffff'
  error: '#f87171'
  on-error: '#ffffff'
  error-container: '#991b1b'
  on-error-container: '#f87171'
  background: '#070913'
  on-background: '#f8fafc'
  surface-variant: '#181e35'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '700'
    lineHeight: '1.3'
  title-sm:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: '1.55'
  body-md:
    fontFamily: Inter
    fontSize: 13.5px
    fontWeight: '400'
    lineHeight: '1.55'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 230px
  ai-panel-width: 300px
  page-padding-desktop: 24px
  page-padding-mobile: 16px
  grid-gap: 24px
  list-gap: 12px
---

# Cerebro Obsidian-Crimson — Design System

## Brand Identity
- **App name:** Cerebro Personal
- **Logo mark:** layered-diamond SVG icon (24×24), white stroke
- **Logo container:** 36×36 px, `border-radius: 10px`, gradient `linear-gradient(135deg, #1F3A52, #901B2F)`
- **Personality:** Ultra-Premium, Architectural, Systematic, and Intelligent. Tailored for structural engineers and high-productivity technical professionals.

## Typography
- **Headlines / Display:** `Outfit` (weights 600, 700, 800) for structural weight and geometry.
- **UI / Body:** `Inter` (weights 400, 500, 600) with `-0.015em` tracking for flawless readable records and tables.
- **Eyebrows / Meta Labels:** `Inter` uppercase, weight 700, size 10px, with `0.08em` tracking.

## Color Tokens

### Light Theme ("Architectural Silk")
- `bg`: `#F8FAFC` (Clean slate white)
- `surface`: `#ffffff` (Solid panels)
- `glass`: `rgba(255, 255, 255, 0.8)` (Frosted glass panels)
- `border`: `rgba(31, 58, 82, 0.05)` (Ultra-thin borders)
- `accent`: `#1F3A52` (Corporate Deep Blue - stable, engineering-oriented)
- `accentSoft`: `rgba(31, 58, 82, 0.07)` (Soft blue tag background)
- `accentGlow`: `rgba(31, 58, 82, 0.15)` (Accent hover glow aura)
- `coral`: `#901B2F` (Corporate NSR-10 Crimson Red - high importance)
- `coralSoft`: `rgba(144, 27, 47, 0.07)` (Soft red warning tag background)
- `purple`: `#8B5CF6` (AI Intelligence Violet - highly premium, energetic contrast)
- `purpleSoft`: `rgba(139, 92, 246, 0.07)` (AI tag background)

### Dark Theme ("Cosmic Obsidian")
- `bg`: `#070913` (Obsidian rich space navy)
- `surface`: `#0f1423` (Frosted obsidian panels)
- `glass`: `rgba(15, 20, 35, 0.65)` (Glassmorphism backdrop)
- `border`: `rgba(255, 255, 255, 0.07)` (Subtle glass bevel edge)
- `accent`: `#3b82f6` (Vibrant Electric Blue - active UI elements)
- `accentSoft`: `rgba(59, 130, 246, 0.15)` (Soft blue dark chip background)
- `coral`: `#f87171` (Vibrant Crimson Rose - high urgency/destructive)
- `coralSoft`: `rgba(248, 113, 113, 0.12)` (Soft rose tag background)
- `purple`: `#a78bfa` (Neural AI Lavender - neon intelligence contrast)
- `purpleSoft`: `rgba(167, 139, 250, 0.12)` (AI tag background)

## Animations & Transitions
- **Organic Spring Physics:** All hover states and interactive buttons use `cubic-bezier(0.34, 1.56, 0.64, 1)` for spring-physics tactile feel.
- **Staggered View Entrances:** Panels and lists use `fadeInUp` sliding entry `0.4s` cubic-bezier.
- **Ambient Nebula Glow:** Radial background glows (`bg-radial-glow`) slowly float `nebulaFloat` in the corners to create physical glass depth.
- **Siri-like AI Neural Orb:** Bottom sidebar orb pulses in multi-gradient mesh shapes. Idle represents breathing blue-violet; Listening represents crimson-amber expanding waves; Thinking represents a fast-spinning teal-white nebula.
