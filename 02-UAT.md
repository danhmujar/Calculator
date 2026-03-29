# Phase 02 UAT: Asset & Build Modernization

**Session Started:** 2026-03-30
**Tester:** Gemini CLI
**Status:** PASS

## Test Case Registry

| ID | Test Case | Method | Requirement | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-P2-01** | **Externalized SVG Sprite Sheet** | Automated (Playwright) | [P2-T1] | PASS |
| **UAT-P2-02** | **PWA Manifest Integrity** | Automated (Playwright) | [P2-T2] | PASS |
| **UAT-P2-03** | **Production Asset Hashing** | Automated (Playwright) | [P2-T2] | PASS |
| **UAT-P2-04** | **Service Worker Registration** | Automated (Playwright) | [P2-T2] | PASS |
| **UAT-P2-05** | **Bundled mathjs/mathlive (Scientific Mode)** | Automated (Playwright) | [P2-T3] | PASS |
| **UAT-P2-06** | **Offline Mode Capability** | Automated (Playwright) | [P2-T2] | PASS |

## Execution Logs

### [2026-03-30] Session Initialization
- Initialized UAT plan based on Phase 02 requirements.
- Extracted automated tests from `tests/phase-02.spec.js` and `tests/uat-02.spec.js`.

### [2026-03-30] Test Execution & Bug Fixing
- **Issue Found (UAT-P2-05):** Scientific Mode expression evaluation was broken in production.
    - **Diagnosis:** `mathjs` was initialized with insufficient tree-shaken dependencies (`addDependencies`, `evaluateDependencies`, `numberDependencies`), missing `sqrt` and other math functions.
    - **Fix:** Switched to `create(all)` in `services/app.js`. Verified fix with automated test.
- **Issue Found (UAT-P2-01):** SVG icons were 404ing in production due to absolute pathing.
    - **Diagnosis:** Icons referenced `/assets/sprites.svg` which resolved incorrectly when the application was served from the `/Calculator/` sub-path base.
    - **Fix:** Updated `index.html` and `services/app.js` to use base-relative `./assets/sprites.svg`.
- **Issue Found (UAT-P2-06):** Offline mode was non-functional and cache was empty.
    - **Diagnosis:** 
        1. Service Worker failed to install because `includeAssets` in `vite.config.js` listed non-existent files (`favicon.ico`, `apple-touch-icon.png`).
        2. Fonts were missing from precache (`.woff2` not in `globPatterns`).
        3. Service Worker didn't take control immediately (missing `clientsClaim` / `skipWaiting`).
    - **Fix:** 
        1. Removed missing assets from `vite.config.js`.
        2. Added `woff2` to `globPatterns`.
        3. Enabled `clientsClaim` and `skipWaiting`.
        4. Verified full offline functionality (including math evaluation) via Playwright.

## Defect Log

| ID | Title | Priority | Status |
| :--- | :--- | :--- | :--- |
| **D-P2-01** | `mathjs` tree-shaking too aggressive | HIGH | FIXED |
| **D-P2-02** | Absolute pathing for SVG sprites | MEDIUM | FIXED |
| **D-P2-03** | SW Install failure due to missing assets | HIGH | FIXED |
| **D-P2-04** | Fonts missing from PWA precache | LOW | FIXED |

## Final Verdict
Phase 02 satisfies all User Acceptance criteria after the applied hotfixes. The application is now fully modernized with a robust PWA build and bundled dependencies.
