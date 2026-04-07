# Phase 06: implement-bts-theme - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04
**Phase:** 06-implement-bts-theme
**Areas discussed:** Visual Style, Color Palette, Dark Mode Behavior, Iconography/Assets

---

## Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Solid Color | Standard CSS-based theme | |
| Dynamic Aurora Gradient | WebGL animated background - Recommended for the modern look | |
| Other | Custom freeform response | ✓ |

**User's choice:** `background is brain_session\bts_chibi_bg_1775310615594.png is bubble particle animation`
**Notes:** User requested a specific background image with a custom bubble particle animation instead of the standard options.

---

## Color Palette

| Option | Description | Selected |
|--------|-------------|----------|
| Classic "Borahae" Purple | Deep, vibrant violet - Recommended | ✓ |
| Neon/Synthwave Purple | High contrast, bright magenta/cyan accents | |
| Soft Pastel Purple | Subtle, calming lilac | |

**User's choice:** Classic "Borahae" Purple

---

## Dark Mode Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Support Both | Theme will switch between light and dark variants | |
| Force Dark Mode | Recommended if using Aurora, as glowing gradients look best on dark | ✓ |

**User's choice:** Force Dark Mode

---

## Iconography/Assets

| Option | Description | Selected |
|--------|-------------|----------|
| Colors only | Keep it subtle and clean - Recommended | ✓ |
| Add faint logo watermark | Rendered in the WebGL canvas | |

**User's choice:** Colors only
**Notes:** Although the user chose "Colors only" here, they later clarified in a revision: "i want this public\assets\bts-chibi.gif to be in equal button in main calc sidebar". This was captured as a specific requirement.

---

## Claude's Discretion
- Particle implementation specifics.
- Integration mechanics of the GIF inside the equals button.

## Deferred Ideas
None.
