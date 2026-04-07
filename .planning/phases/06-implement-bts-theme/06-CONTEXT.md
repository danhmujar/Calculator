# Phase 06: implement-bts-theme - Context

**Gathered:** 2026-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Implementing a new BTS-inspired theme featuring a custom image background, bubble particle animation, and a custom GIF in the UI, supporting forced dark mode and utilizing a "Borahae" purple color palette.
</domain>

<decisions>
## Implementation Decisions

### Visual Style
- **D-01:** The background must use `brain_session/bts_chibi_bg_1775310615594.png`.
- **D-02:** The theme should include a bubble particle animation (likely implemented in WebGL since the app is transitioning to WebGL underlays).

### Color Palette & Theme Mode
- **D-03:** Use a "Classic 'Borahae' Purple" color palette.
- **D-04:** The theme must force Dark Mode when activated.

### UI Integration
- **D-05:** The main calculator sidebar's equal button must contain the image `public/assets/bts-chibi.gif`.

### Claude's Discretion
- Technical implementation of the bubble particle animation in WebGL.
- Placement and sizing of the GIF inside the equals button to ensure it looks good and maintains accessibility.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Documents
- `.planning/ROADMAP.md` — Defines phase boundary (Phase 6: Implement BTS Theme).
- `.planning/REQUIREMENTS.md` — Defines strict architectural guidelines (WebGL vanilla, remove CSS filters).

### Assets
- `brain_session/bts_chibi_bg_1775310615594.png` — Target background image.
- `public/assets/bts-chibi.gif` — Target equal button image.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ui/uimanager.js`: `VALID_THEMES` array where the new theme class (e.g., `theme-bts`) will be registered.
- `ui/webgl/renderer.js`: `ThemeObserver` monitors `document.body` classes to trigger shader updates.
- `ui/styles.css`: Contains color themes. A new `.theme-bts` section is needed here to apply the baseline purple values and the background properties.

### Established Patterns
- Themes currently use CSS classes on `document.body` (e.g., `theme-aurora`). The new theme will follow this pattern.
- Dark Mode is forced by adding the `dark-theme` class to the body.

### Integration Points
- Theme Picker dropdown in the DOM to select the BTS theme.
- The Equals button in the DOM for injecting the GIF.
- WebGL Renderer for setting up the texture background and particle system for the bubbles.
</code_context>

<specifics>
## Specific Ideas

- The equal button in the main calc sidebar must contain the `public/assets/bts-chibi.gif`.
- The WebGL underlay needs to support an image background (`brain_session/bts_chibi_bg_1775310615594.png`) and a new particle effect (bubbles) specifically for this theme, rather than just solid colors or the Aurora gradient.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 06-implement-bts-theme*
*Context gathered: 2026-04*
