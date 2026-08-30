# Percentage & Math Calculator

A fast, client-side calculator Progressive Web App for everyday percentage calculations, arithmetic, and scientific expressions.

## Features

- Percentage tools for common business and personal calculations.
- Standard and scientific calculator modes.
- MathLive-powered expression input and Math.js evaluation.
- Responsive layout with light, dark, and themed appearances.
- Local state persistence through `localStorage`.
- Offline-ready PWA behavior through a service worker.
- Keyboard-friendly controls and accessibility-focused interactions.

## Tech stack

- HTML5, CSS3, and vanilla JavaScript
- Vite and `vite-plugin-pwa`
- MathLive and Math.js
- Vitest for unit tests
- Playwright and axe-core for browser and accessibility tests

## Getting started

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

## Commands

```bash
npm run dev          # Start the development server
npm run build        # Build the production app into dist/
npm run preview      # Preview the production build
npm run lint         # Run ESLint and apply configured fixes
npm run format       # Format supported files with Prettier
npm run test:unit    # Run unit tests
npm run test:coverage
npm run test:e2e     # Run Playwright browser tests
```

The service worker must be tested over HTTP(S); it will not work when opening `index.html` directly with `file://`.

## Project structure

```text
index.html           Application shell and calculator markup
services/app.js      Calculator logic, state, and event handling
ui/ui.js             UI behavior, modals, and focus management
ui/styles.css        Responsive styles, themes, and design tokens
sw.js                Service worker and offline caching
manifest.json        PWA metadata
tests/               Unit, browser, PWA, and accessibility tests
```

The application is organized into three layers: calculator/business logic in `services/`, presentation and interaction code in `ui/`, and the entry point in `index.html`.

## Privacy and security

The calculator runs entirely in the browser. Persistent calculator state is stored locally under the `interactiveCalcState` key. The project avoids inline event handlers, unsanitized `innerHTML`, and unpinned CDN dependencies.

## Contributing

Keep changes compatible with the existing vanilla-JavaScript architecture and accessibility requirements. Use concise Conventional Commit-style messages such as `feat: add ...` or `fix: correct ...`.
