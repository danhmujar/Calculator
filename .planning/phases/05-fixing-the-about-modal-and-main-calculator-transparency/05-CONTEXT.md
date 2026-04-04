# Phase 5: fixing the about modal and main calculator transparency - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix WebGL blur underlay on the about-modal and resolve the opaque background masking issue over the main calculator display caused by a CSS selector typo.

</domain>

<decisions>
## Implementation Decisions

### About Modal Focus
- **D-01:** layoutManager integration (Add it to layoutManager observer to handle ResizeObserver shifts)

### Modal Visibility checks
- **D-02:** recommended (Assume user meant "Overlay Open Class" based on earlier options)

### CSS Selector Target
- **D-03:** recommended (Assume user meant "Use ID Selector" based on earlier options)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Underlay requirements
- `.planning/phases/05-fixing-the-about-modal-and-main-calculator-transparency/05-RESEARCH.md` — Identifies the missing `about-modal` registration and incorrect CSS selectors.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ui/uimanager.js`: Has `layoutManager.observe()` logic already available.
- `ui/styles.css`: Has the webgl-active opacity modifications.
- `ui/webgl/renderer.js`: Has `_drawBlurredStage()` logic to tap into.

### Established Patterns
- DOM state reads are done via `layoutManager.getRect()` rather than querying the DOM directly in WebGL render loop.

### Integration Points
- Connecting the `about-modal` to `layoutManager`.
- Updating the webgl background selector in `styles.css`.
- Updating `_drawBlurredStage()` in `ui/webgl/renderer.js` to look for the modal rect.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-fixing-the-about-modal-and-main-calculator-transparency*
*Context gathered: 2026-04-05*