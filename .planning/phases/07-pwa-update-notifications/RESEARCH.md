# Phase 07: PWA Update Notifications - Research

**Researched:** 2026-04-08
**Domain:** Service Worker, PWA Lifecycle, Vite PWA
**Confidence:** HIGH

## Summary

Implementing Service Worker-based update notifications for a static site (GitHub Pages) requires a robust strategy to handle SW cache invalidation. The standard approach involves `vite-plugin-pwa` paired with `workbox-window`. This ensures that when a new build is deployed, the client detects the change, downloads the updated service worker, and provides a clear mechanism for the user to refresh the page.

**Primary recommendation:** Use `vite-plugin-pwa` with `workbox` enabled and `workbox-window` for client-side registration and update management.

## Standard Stack

### Core

| Library           | Version | Purpose                 | Why Standard                               |
| ----------------- | ------- | ----------------------- | ------------------------------------------ |
| `vite-plugin-pwa` | 1.2.0   | PWA/SW generation       | Industry standard for Vite projects        |
| `workbox-window`  | 7.4.0   | SW lifecycle management | Handles `controlling` and `waiting` states |

### Supporting

| Library | Version | Purpose      | When to Use                    |
| ------- | ------- | ------------ | ------------------------------ |
| `vite`  | ^5.0.0  | Build system | Required for `vite-plugin-pwa` |

**Installation:**

```bash
npm install vite-plugin-pwa
```

**Version verification:** `vite-plugin-pwa@1.2.0` (as of 2026-04-08).

## Architecture Patterns

### Recommended Project Structure

```
src/
├── services/
│   └── pwa.js      # SW registration and update UI triggering
└── ui/
    └── uimanager.js # Logic for displaying the update toast
```

### Pattern 1: Service Worker Lifecycle management

**What:** Using `workbox-window` to listen for the `controlling` and `waiting` events.
**When to use:** On application load.
**Example:**

```typescript
import { Workbox } from 'workbox-window';

if ('serviceWorker' in navigator) {
  const wb = new Workbox('/sw.js');
  wb.addEventListener('waiting', () => {
    // Trigger your update toast UI here
    showUpdateToast();
  });
  wb.register();
}
```

### Anti-Patterns to Avoid

- **Hard-coding cache strategy:** Rely on `vite-plugin-pwa` defaults, do not hand-roll cache-busting regexes if possible.
- **Auto-reloading on update:** Never force a reload without user intervention, as it can cause data loss in current user sessions.

## Don't Hand-Roll

| Problem             | Don't Build      | Use Instead       | Why                                                |
| ------------------- | ---------------- | ----------------- | -------------------------------------------------- |
| SW Registration     | Custom JS SW reg | `workbox-window`  | Complex lifecycle management, error handling       |
| Manifest generation | Manual JSON      | `vite-plugin-pwa` | Automated asset hashing, dynamic manifest creation |

**Key insight:** Service Worker lifecycles are notoriously finicky; Workbox is thoroughly tested across browsers.

## Common Pitfalls

### Pitfall 1: Stale Cache

**What goes wrong:** User sees old content after deployment.
**Why it happens:** SW is controlling the page, and the cached version is still active.
**How to avoid:** Correct `skipWaiting` configuration and clear `controlling` event handling.

## Code Examples

### Update Notification Hook

```javascript
// ui/uimanager.js
export function showUpdateToast() {
  const toast = document.getElementById('update-toast');
  toast.style.display = 'block';
  toast.onclick = () => {
    window.location.reload();
  };
}
```

## State of the Art

| Old Approach   | Current Approach  | When Changed        | Impact                              |
| -------------- | ----------------- | ------------------- | ----------------------------------- |
| Manual `sw.js` | `vite-plugin-pwa` | Post-Vite ecosystem | Simplifies build-time asset hashing |

## Environment Availability

| Dependency        | Required By | Available | Version | Fallback |
| ----------------- | ----------- | --------- | ------- | -------- |
| `vite-plugin-pwa` | PWA/SW      | ✓         | 1.2.0   | —        |

## Validation Architecture

### Test Framework

| Property           | Value                 |
| ------------------ | --------------------- |
| Framework          | Playwright            |
| Full suite command | `npx playwright test` |

## Sources

### Primary (HIGH confidence)

- `vite-plugin-pwa` official documentation.
- `workbox-window` official documentation.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: HIGH

**Research date:** 2026-04-08
**Valid until:** 2026-05-08
