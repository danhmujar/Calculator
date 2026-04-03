# Codebase Structure

## Directory Layout
- **Root**: Contains configuration (`package.json`, `vite.config.js`, `playwright.config.js`) and the main HTML entry (`index.html`).
- **`services/`**: Holds the business logic module (`app.js`). This is where the core calculator logic lives.
- **`ui/`**: Holds the presentation logic (`ui.js`) and all styling (`styles.css`).
- **`tests/` / `playwright-report/`**: Contains end-to-end tests and visual/accessibility test assets.
- **`public/` / `assets/`**: Unprocessed static assets, sprites (`sprites.svg`), and icons.
- **`.planning/`**: GSD AI workflow documents, roadmaps, research, and project specifications.

## Key Files
- `index.html`: The structural DOM and entry point.
- `services/app.js`: The heart of the application logic.
- `ui/ui.js`: Presentation, view management, themes.
- `ui/styles.css`: CSS variables and styling rules for standard, scientific, and responsive mobile layouts.

## Conventions
- **Naming**: BEM-like CSS classes (`calc-card`, `calc-display-top`). CamelCase for JavaScript identifiers.
- **Modularity**: Strict separation between `services/` (logic) and `ui/` (view).
