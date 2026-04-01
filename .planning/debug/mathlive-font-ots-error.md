---
status: resolved
trigger: "Failed to decode downloaded font: <URL>\nOTS parsing error: invalid sfntVersion: 1008813135\nMathLive 0.109.0: The math fonts could not be loaded from \"http://localhost:5173/Calculator/node_modules/.vite/deps/fonts\""
created: 2026-04-01T21:27:00Z
updated: 2026-04-01T21:27:00Z
---

## Symptoms

- Console errors: "Failed to decode downloaded font" followed by "OTS parsing error: invalid sfntVersion: 1008813135".
- Decoding `1008813135` into ASCII yields `<!DO`, indicating the browser is receiving a HTML 404 page from the dev server instead of font data.
- MathLive fails to render mathematical expressions correctly in Scientific Mode because fonts are missing.

## Evidence

- **Hex Check**: A valid WOFF2 font file should start with `wOF2`.
- **Timing Issue**: MathLive's internal font resolution occurs during its initialization. In a Vite environment, the module is pre-bundled into `node_modules/.vite/deps/`, so the default relative font path resolves to a non-existent directory.
- **Path Verification**: The fonts are correctly located in `public/fonts/` (serving at `/Calculator/fonts/`), but the application was setting `fontsDirectory` *after* the font loading attempt was already triggered by the custom element's definition.

## Resolution

- **Root Cause**: The `window.MathfieldElement.fontsDirectory` override was being applied too late—after `customElements.whenDefined('math-field')` but before the browser had a chance to render, leading to an initial (and failing) font request to the wrong path.
- **Fix**: Moved the assignment of `fontsDirectory` to immediately after the `await import('mathlive')` call but *before* `await customElements.whenDefined('math-field')`.
- **Implementation**:
  ```javascript
  try {
      await import('mathlive');
      if (window.MathfieldElement) {
          window.MathfieldElement.fontsDirectory = '/Calculator/fonts/';
      }
      await customElements.whenDefined('math-field');
  } catch (err) { ... }
  ```
- **Verification**: Reloaded the page, switched to Scientific Mode, and confirmed no further OTS errors in the console.

## Documentation Reference
- Files modified: [uimanager.js](file:///c:/Users/Danh%20Mujar/Desktop/test/Calculator/ui/uimanager.js)
