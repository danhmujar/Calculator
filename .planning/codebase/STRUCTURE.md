# Codebase Structure

**Analysis Date:** 2025-05-13

## Directory Layout

```
[project-root]/
├── public/          # Static assets and service worker
├── services/        # Core business logic and state
├── ui/              # Visual components, styles, and fonts
├── scripts/         # Build and post-build scripts
├── index.html       # Application entry point
├── package.json     # Node.js manifest
├── vite.config.js   # Vite build configuration
└── sw.js            # Service worker (symlinked/copied from public)
```

## Directory Purposes

**`public/`:**
- Purpose: Contains assets that are served directly without processing by Vite (except `sw.js`).
- Contains: Icons (`icon-192.svg`, `icon-512.svg`), manifest (`manifest.json`), service worker (`sw.js`).
- Key files: `public/sw.js` (PWA caching and offline logic).

**`services/`:**
- Purpose: Houses the application's core logic and service layer.
- Contains: Main application script (`app.js`).
- Key files: `services/app.js` (state management, event bindings, calculation logic).

**`ui/`:**
- Purpose: Manages the presentation layer, including styles, fonts, and UI-specific logic.
- Contains: Stylesheets (`styles.css`, `fonts.css`), fonts (`fonts/`), and UI component logic (`ui.js`).
- Key files: `ui/ui.js` (modals and resizers), `ui/styles.css` (global styles).

**`scripts/`:**
- Purpose: Scripts for the build and deployment pipeline.
- Contains: `postbuild.js` (finalizes the build artifact).

## Key File Locations

**Entry Points:**
- `index.html`: Main HTML document and entry point for the Vite application.
- `services/app.js`: Root module for business logic and state.

**Configuration:**
- `vite.config.js`: Configuration for Vite bundler.
- `package.json`: Dependencies and script definitions.
- `public/manifest.json`: PWA manifest definition.

**Core Logic:**
- `services/app.js`: Centralized business logic, state management, and event orchestration.

**Testing:**
- `.agent/skills/`: Custom agent-based tests and workflows (not part of the standard runtime).
- `node_modules/@playwright/test`: Playwright integration for automated testing.

## Naming Conventions

**Files:**
- Kebab-case or lowercase for assets: `icon-192.svg`, `fonts.css`.
- Descriptive names for scripts: `app.js`, `ui.js`.

**Directories:**
- Lowercase and descriptive: `public`, `services`, `ui`.

## Where to Add New Code

**New Calculation Logic:**
1. Implement the calculation logic in `services/app.js` (e.g., inside `calculateRowResult` or as a new standalone service function).
2. Define a template in `ROW_TEMPLATES` within `services/app.js`.
3. Add a corresponding `calc-card` in `index.html`.

**New UI Feature (Modals, Panels):**
1. Add the HTML structure to `index.html`.
2. Implement visual styles in `ui/styles.css`.
3. Add interaction logic (focus traps, transitions) in `ui/ui.js` (wrap in an IIFE).

**New Styles or Variables:**
- Global variables and theme-specific styles belong in `ui/styles.css`.
- Font-face declarations belong in `ui/fonts.css`.

**Static Assets:**
- Place new icons, images, or configuration files (like `robots.txt`) in the `public/` directory.

## Special Directories

**`node_modules/`:**
- Purpose: External build-time dependencies (Vite, Playwright).
- Generated: Yes (via `npm install`).
- Committed: No.

**`dist/`:**
- Purpose: Final production build output.
- Generated: Yes (via `npm run build`).
- Committed: No (usually ignored by git).

---

*Structure analysis: 2025-05-13*
