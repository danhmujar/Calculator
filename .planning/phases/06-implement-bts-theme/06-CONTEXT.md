# Phase 06: implement-bts-theme - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a new visual theme inspired by BTS (K-pop group) into the existing calculator. This involves adding the new theme to the `VALID_THEMES` array, wiring it into the CSS/WebGL architecture, defining the color uniforms, and integrating the specific assets provided (`bts-chibi.gif` and `bts_chibi_bg...png`).

</domain>

<decisions>
## Implementation Decisions

### Theme Architecture
- **D-01:** Implement as an Aurora Theme (WebGL animated gradients). This ensures the BTS theme has the premium visual parity with the existing cosmic themes.

### Asset Integration
- **D-02:** The `bts-chibi.gif` animation will run when the user clicks the theme. The `bts_chibi_bg...png` asset will be integrated directly into the background of the calculator, overlaid with an animated "shining stars" effect across the background to enhance the cosmic BTS aesthetic.

### Color Palette
- **D-03:** The primary color base is Deep Purple (Signature BTS color, e.g., `#8A2BE2` / `#9D00FF`).

### Dark/Light Mode
- **D-04:** The theme will support both Light and Dark modes. Since it's an Aurora theme, it will require a static CSS fallback for light mode, as Aurora themes currently force dark mode.

### Claude's Discretion
- How exactly the `bts-chibi.gif` is animated or overlayed when the theme is clicked.
- How the static `bts_chibi_bg...png` interacts with the WebGL Aurora background (e.g., blending modes, opacity, positioning).
- Specific easing, shader uniforms (aurora speeds, amplitudes) to complement the purple colors.
- Light mode static fallback design details.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture and Theming
- `.planning/codebase/ARCHITECTURE.md` - Overall system architecture.
- `.planning/REQUIREMENTS.md` - Core requirements for WebGL integration and stacking parity.

### Existing Code
- `ui/uimanager.js` - Contains `VALID_THEMES` and theme switcher logic.
- `services/theme.js` - State container for active themes.
- `ui/webgl/renderer.js` - Injects theme color uniforms to the WebGL shader context.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `themeManager` (`services/theme.js`): Provides color interpolations to `renderer.js`.
- `.theme-picker` (`ui/styles.css`): UI widget that displays theme swatches. The BTS theme will need a swatch added.

### Established Patterns
- Aurora Themes (`theme-aurora-*`): Forces `dark-theme` by default and utilizes the Kawase dual-pass blur and custom color uniforms in WebGL. Supporting Light mode for Aurora requires modifying this constraint or providing a static CSS alternate.

### Integration Points
- Add `theme-aurora-bts` to `VALID_THEMES` array in `uimanager.js`.
- Provide `#8A2BE2` shader uniform configuration in `renderer.js` when this theme is active.
- Add corresponding CSS selectors in `ui/styles.css` (e.g., `body.theme-aurora-bts`).

</code_context>

<specifics>
## Specific Ideas

- Ensure the easter egg feels cohesive with the overall minimalist frosted glass UI.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-implement-bts-theme*
*Context gathered: 2026-04-06*
