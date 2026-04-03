# Codebase Stack

## Core Technologies
- **HTML/CSS/JS**: Vanilla frontend stack with no framework (React/Vue/etc. are not used).
- **Vite**: Modern build tool and dev server (`^7.0.0`). Provides fast HMR and bundling.
- **PWA**: Uses `vite-plugin-pwa` (`^1.2.0`) to make the application installable and capable of offline use.
- **MathLive**: Web Component for math input and formatting (`^0.109.0`).
- **MathJS**: Extensive math library for JavaScript and Node.js (`^15.1.1`).

## Tooling
- **Playwright**: End-to-end testing framework (`^1.58.2`).
- **Axe-core**: Accessibility testing engine, integrated with Playwright (`@axe-core/playwright ^4.11.1`).

## Build & Deployment
- Handled by Vite (`npm run build`, `npm run preview`).
- The application is a static site with client-side logic.
