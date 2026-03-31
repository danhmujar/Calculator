# External Integrations

**Analysis Date:** 2025-02-14

## APIs & External Services

**Math Logic:**
- `mathjs` - Client-side math library for all arithmetic and formula evaluations.
- `mathlive` - Client-side library for WYSIWYG mathematical expression input.

**Accessibility:**
- `axe-core` - Automated accessibility testing within the Playwright test suite.

## Data Storage

**Databases:**
- None (100% client-side application).

**File Storage:**
- Local filesystem (via Service Worker) - PWA assets (JS, CSS, HTML, SVG, WOFF2) are cached locally for offline functionality.

**Caching:**
- `localStorage` - Used for persisting application state including calculator history, active theme, and input values across sessions. Implementation in `services/store.js`.

## Authentication & Identity

**Auth Provider:**
- None (100% client-side application).

## Monitoring & Observability

**Error Tracking:**
- Browser console logging - No external error monitoring service (Sentry, etc.) detected.

**Logs:**
- No server-side logs.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages - Static hosting via `.github/workflows/deploy.yml`.

**CI Pipeline:**
- GitHub Actions - Automated build and deployment to GitHub Pages triggered on push to `main` branch.

## Environment Configuration

**Required env vars:**
- None.

**Secrets location:**
- None detected.

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- None.

---

*Integration audit: 2025-02-14*
