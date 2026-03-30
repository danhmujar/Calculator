# Phase 02: Asset & Build Modernization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 02-asset-build-modernization
**Areas discussed:** SVG Strategy, PWA Strategy, Library Migration, Asset Hashing

---

## SVG Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Manual Sprite Sheet | One sprites.svg in public/assets/ using <symbol> and <use>. (Supports CSS variables) | ✓ |
| Individual Files | Separate .svg files in public/assets/ referenced via <img>. (Simpler but limited theming) | |
| Vite Plugin | Use vite-plugin-svg-icons to automate. (Adds a dependency) | |

**User's choice:** Manual Sprite Sheet (Recommended)
**Notes:** 24+ SVGs in index.html to be externalized while preserving CSS variable support for themes.

---

## PWA Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt for Update | Show a toast ("New version available. Refresh?") to the user. (Recommended for stability) | ✓ |
| Auto Update | Automatically refresh the page when a new version is detected. (Faster) | |

**User's choice:** Prompt for Update (Recommended)
**Notes:** Safer for active calculator sessions where user inputs might be lost on sudden reload.

---

## Library Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Custom Bundle | Use mathjs/number and only required mathlive modules. (Recommended for performance) | ✓ |
| Full Library | Import everything from mathjs and mathlive. (Easier but heavier) | |

**User's choice:** Custom Bundle (Recommended)
**Notes:** Aligns with the "Performance-First" goal from Phase 1.

---

## Asset Hashing

| Option | Description | Selected |
|--------|-------------|----------|
| Re-enable Vite Hashing | Use hashed filenames (e.g., main.hash.js) for robust cache-busting. (Standard practice) | ✓ |
| Maintain No Hashing | Continue with static filenames (e.g., main.js). (Currently disabled in config) | |

**User's choice:** Re-enable Vite Hashing (Recommended)
**Notes:** Modern PWA tools handle hashing automatically, ensuring reliable updates.

---

## Claude's Discretion

- **SVG Naming:** Claude will define descriptive IDs (e.g., `icon-plus`, `ui-calc-body`) for the sprite sheet.
- **PWA Toast UI:** Claude will design a non-intrusive toast notification for updates.

---

## Deferred Ideas

- **Advanced Image Optimization:** Deferred to later phases.
- **Offline Persistence Polish:** Fine-tuning MathLive complex state persistence deferred to Phase 3/4.
