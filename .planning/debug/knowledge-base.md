# GSD Debug Knowledge Base

Resolved debug sessions. Used by gsd-debugger to surface known-pattern hypotheses at the start of new investigations.

---


## sci-std-mode-small-font-size — Tiny font size '0' when switching SCI to STD mode
- **Date:** 2025-02-14
- **Error patterns:** small font size, mode switch, SCI to STD, rendering bug
- **Root cause:** Race condition during mode switch where measurement happens on hidden (display: none) display container.
- **Fix:** Added ResizeObserver to UIManager, synchronized store updates with layout change via RAF, and added defensive check to Renderer.fitDisplayText.
- **Files changed:** ui/uimanager.js, ui/renderer.js
---

