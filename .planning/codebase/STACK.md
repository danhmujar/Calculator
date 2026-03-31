# Technology Stack

**Analysis Date:** 2025-02-14

## Languages

**Primary:**
- JavaScript (ESM) - Core application logic, state management, and UI interactions in `services/` and `ui/`.
- HTML5 - Application structure and accessibility in `index.html`.
- CSS3 - Styling, layout, and animations in `ui/styles.css` and `ui/fonts.css`.

**Secondary:**
- LaTeX (via MathLive) - Mathematical notation for scientific mode.

## Runtime

**Environment:**
- Browser (Client-side execution)
- Node.js (v20 used in CI/CD pipeline)

**Package Manager:**
- npm (Node Package Manager)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Vanilla JavaScript - The application follows a 3-tier architectural pattern (Services, UI, Store) without a heavy frontend framework.

**Testing:**
- Playwright (^1.58.2) - E2E and integration testing.
- axe-core (^4.11.1) - Accessibility testing integrated with Playwright.

**Build/Dev:**
- Vite (^7.0.0) - Build tool and development server.
- vite-plugin-pwa (^1.2.0) - Progressive Web App support and service worker generation.

## Key Dependencies

**Critical:**
- `mathjs` (^15.1.1) - Primary engine for evaluating mathematical expressions and percentages.
- `mathlive` (^0.109.0) - WYSIWYG math editor used for the scientific calculator mode.

**Infrastructure:**
- `playwright-core` (^1.58.2) - Underlying browser automation for tests.

## Configuration

**Environment:**
- Client-side configuration via constants in `services/app.js`.
- PWA manifest and service worker configuration in `vite.config.js`.

**Build:**
- `vite.config.js`: Configures Vite, PWA plugin, and base path for GitHub Pages.
- `package.json`: Defines scripts for dev, build, and preview.

## Platform Requirements

**Development:**
- Node.js v20+
- npm

**Production:**
- Modern web browser with Service Worker and ES Module support.
- Deployment target: GitHub Pages (static hosting).

---

*Stack analysis: 2025-02-14*
