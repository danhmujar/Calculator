# Phase 5: fixing the about modal and main calculator transparency - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 05-fixing-the-about-modal-and-main-calculator-transparency
**Areas discussed:** About Modal Focus, Modal Visibility checks, CSS Selector Target

---

## About Modal Focus

| Option | Description | Selected |
|--------|-------------|----------|
| layoutManager integration | Add it to layoutManager observer to handle ResizeObserver shifts | ✓ |
| Manual animation frame sync | Only verify visibility vs DOM, push manual rect on frame updates | |

**User's choice:** layoutManager integration
**Notes:** 

---

## Modal Visibility checks

| Option | Description | Selected |
|--------|-------------|----------|
| Overlay Open Class | Use parent '.about-overlay.open' class as source of truth | ✓ (implied by 'recommended') |
| Computed CSS state | Use computed style ('opacity' or 'display') | |

**User's choice:** recommended
**Notes:** 

---

## CSS Selector Target

| Option | Description | Selected |
|--------|-------------|----------|
| Use ID Selector | Change to #main-calc-display to match DOM ID | ✓ (implied by 'recommended') |
| Use Class Selector | Add a class like .calc-display to DOM and target that | |

**User's choice:** recommended
**Notes:** 

---

## Claude's Discretion

## Deferred Ideas
