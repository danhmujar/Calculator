# Technology Stack

**Analysis Date:** 2025-05-15

## Languages

**Primary:**
- JavaScript (ES6+) - Core application logic and state management in `services/app.js` and `ui/ui.js`.

**Secondary:**
- HTML5 - Semantic structure and accessibility in `index.html`.
- CSS3 - Styling, layout, and animations in `ui/styles.css` and `ui/fonts.css`.

## Runtime

**Environment:**
- Modern Browser - Runs entirely client-side; relies on ES modules, Service Workers, and CSS variables.
- Node.js (v20) - Used for development environment and build scripts.

**Package Manager:**
- npm (v10+) - Used for dependency management.
- Lockfile: `package-lock.json` present.

## Frameworks

**Core:**
- Vanilla JavaScript - No heavy frontend frameworks (like React or Vue) are used; the project follows a native 3-tier architecture.
- Vite (v8.0.3) - Build tool and development server.

**Testing:**
- Playwright (v1.58.2) - End-to-end testing.
- Axe-core (v4.11.1) - Accessibility auditing.

**Build/Dev:**
- Vite (v8.0.3) - Module bundling and asset optimization.
- Custom Build Script: `scripts/postbuild.js` for post-processing the Service Worker.

## Key Dependencies

**Critical:**
- MathLive (v0.108.3) - Loaded from `https://unpkg.com`; provides the WYSIWYG LaTeX math input for scientific mode.
- Math.js (v11.8.0) - Loaded from `https://cdnjs.cloudflare.com`; used for parsing and evaluating complex mathematical expressions.
- Intl.NumberFormat - Native browser API used for professional decimal formatting.

**Infrastructure:**
- Service Worker (v13) - Implemented in `public/sw.js` for offline caching and PWA functionality.

## Configuration

**Environment:**
- No environment variables (`.env`) used; configuration is managed through constants in `services/app.js`.

**Build:**
- `vite.config.js` - Configures the base path (`/Calculator/`) and rollup options (disabling filename hashing for simpler service worker logic).

## Platform Requirements

**Development:**
- Node.js 20+
- npm 10+

**Production:**
- GitHub Pages - Primary deployment target.

---

*Stack analysis: 2025-05-15*
