---
wave: 1
depends_on: []
files_modified: ["index.html", "ui/styles.css", "ui/uimanager.js", "ui/webgl/renderer.js", "ui/webgl/shaders.js"]
autonomous: true
---

# Plan 01: Implement BTS Theme CSS, UI, and WebGL Logic

<objective>
Register the BTS theme in UIManager, add CSS rules for the purple color palette, update the theme picker in index.html, configure the Equals button image, and implement the procedural bubbles and background image in the WebGL renderer.
</objective>

<requirements>
- D-01: Background image `bts_chibi_bg...`
- D-02: Bubble particle animation (WebGL)
- D-03: Purple color palette
- D-04: Force Dark Mode
- D-05: Equals button chibi GIF
- D-06: BTS logo for theme picker
</requirements>

<tasks>
<task>
<action>
In `index.html`, add `<button class="theme-swatch" style="background-image: url('./assets/bts logo.png'); background-size: cover; border-color: transparent;" data-theme="theme-bts" title="Borahae Purple (BTS Theme)" role="radio" aria-checked="false" aria-label="Borahae Purple"></button>` to the theme picker.
</action>
<read_first>index.html</read_first>
<acceptance_criteria>
`index.html` contains `data-theme="theme-bts"`
</acceptance_criteria>
</task>

<task>
<action>
In `ui/styles.css`, add `body.theme-bts` and `body.theme-bts.dark-theme` colors, and the CSS override for the equal button:
`body.theme-bts .calc-btn.eq { background-image: url('./assets/bts-chibi.gif'); background-size: cover; background-position: center; color: transparent; }`
</action>
<read_first>ui/styles.css</read_first>
<acceptance_criteria>
`ui/styles.css` contains `body.theme-bts .calc-btn.eq`
</acceptance_criteria>
</task>

<task>
<action>
In `ui/uimanager.js`, add `'theme-bts'` to `VALID_THEMES`. Update `toggleTheme` and `setThemeColor` to handle `theme-bts` exactly like `theme-aurora` (force dark-theme when activated, remove it properly).
</action>
<read_first>ui/uimanager.js</read_first>
<acceptance_criteria>
`ui/uimanager.js` contains `'theme-bts'` in `VALID_THEMES`
</acceptance_criteria>
</task>

<task>
<action>
Update `ui/webgl/shaders.js` `PRIMITIVE_FRAG` source to accept `uniform float uIsBTS;`, `uniform sampler2D uBackgroundTex;`.
Inside `main()`, if `uIsBTS > 0.5`, mix the `uBackgroundTex` with the Kawase blur and render procedural bubbles ascending using `sin` and `u_time`.
</action>
<read_first>ui/webgl/shaders.js</read_first>
<acceptance_criteria>
`ui/webgl/shaders.js` contains `uniform float uIsBTS`
</acceptance_criteria>
</task>

<task>
<action>
Update `ui/webgl/renderer.js` to load `public/assets/bts_chibi_bg_1775310615594.png` on initialization (or lazily) as a WebGL Texture.
In `render()`, set `uIsBTS` to 1.0 if `document.body.className.includes('theme-bts')`. Bind the background texture to a new unit and pass to `uBackgroundTex`.
</action>
<read_first>ui/webgl/renderer.js</read_first>
<acceptance_criteria>
`ui/webgl/renderer.js` contains `uIsBTS: ` uniform mapping.
</acceptance_criteria>
</task>
</tasks>
