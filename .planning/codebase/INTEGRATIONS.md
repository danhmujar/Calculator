# External Integrations

**Analysis Date:** 2025-05-15

## APIs & External Services

**Math Services:**
- MathLive - Used for LaTeX-based formula input and scientific calculation UI.
  - SDK/Client: `https://unpkg.com/mathlive@0.108.3`
  - Auth: None (Public CDN)
- Math.js - Primary engine for evaluating complex mathematical expressions and handling precision.
  - SDK/Client: `https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.js`
  - Auth: None (Public CDN)

## Data Storage

**Databases:**
- None - Application is entirely client-side.

**File Storage:**
- Local Filesystem Only - No cloud storage.

**Caching:**
- Service Worker Cache - Custom implementation in `public/sw.js` using Cache API to store the app shell and CDN libraries for offline use.
- LocalStorage - Used for persisting application state and user preferences:
  - `interactiveCalcState`: Stores the calculator display, history, and mode.
  - `calcSidebarWidth`: Stores the user-resized width of the calculator panel.

## Authentication & Identity

**Auth Provider:**
- None - The app is open and requires no authentication.

## Monitoring & Observability

**Error Tracking:**
- None.

**Logs:**
- Console - Basic debugging via browser developer tools.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages - Primary hosting platform for the web application.

**CI Pipeline:**
- GitHub Actions - Defined in `.github/workflows/deploy.yml` for building and deploying to GitHub Pages on every push to the `main` branch.

## Environment Configuration

**Required env vars:**
- None.

**Secrets location:**
- Not applicable - The project contains no secrets or sensitive configuration.

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- None.

---

*Integration audit: 2025-05-15*
