# Phase 06: implement-bts-theme - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 06-implement-bts-theme
**Areas discussed:** Theme Architecture, Asset Integration, Color Palette, Dark/Light Mode

---

## Theme Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Aurora Theme | Uses WebGL shaders, animated gradients, deeper blur effects. Forces dark mode. (Recommended) | ✓ |
| Static CSS Theme | Uses solid colors/simple CSS gradients. | |

**User's choice:** Aurora Theme
**Notes:** User chose the premium WebGL-powered theme architecture.

---

## Asset Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Background Watermark | Subtle background watermark beneath the calculator. | |
| About Modal Only | Display the chibi only in the About modal. | |
| Easter Egg | A clickable easter egg that triggers a visual effect. | ✓ |

**User's choice:** Easter Egg
**Notes:** User preferred an interactive easter egg feature.

---

## Color Palette

| Option | Description | Selected |
|--------|-------------|----------|
| Deep Purple | Signature BTS Deep Purple (#8A2BE2 / #9D00FF) | ✓ |
| Pastel Pink/Purple | Softer pastel pinks and purples | |
| Midnight Purple | Dark midnight blue base with bright purple glowing accents | |

**User's choice:** Deep Purple
**Notes:** Selected the classic BTS purple hue.

---

## Dark/Light Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Locked to Dark Mode | Best for Aurora WebGL themes (Recommended) | |
| Support Both | Needs a static fallback for light mode | ✓ |

**User's choice:** Support Both
**Notes:** This creates an additional constraint since Aurora themes traditionally force dark mode.

---

## Claude's Discretion

- Easter egg trigger location and interaction.
- Light mode fallback design for the Aurora theme.
- Exact WebGL shader uniforms tuning for the Deep Purple palette.

## Deferred Ideas

None.
