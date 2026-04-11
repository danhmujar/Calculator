# Integrations

## External Services & Libraries

- **MathLive (`mathlive`)**: Integrated as an external module for rendering and editing complex math expressions visually (WYSIWYG math input).
- **Math.js (`mathjs`)**: Used to evaluate mathematical expressions entered by users, supporting the scientific calculator capabilities.

## Architecture

- **Offline-First PWA**: No backend or external cloud database integration exists. All functionality is processed 100% on the client.
- **Service Worker**: Caches assets and dependencies to allow the app to work offline, managed by `vite-plugin-pwa`.
- **State Persistence**: Uses browser's `localStorage` to save user session state directly on the device.

There are no APIs, Webhooks, or Authentication Services integrated or invoked in this application. All logic runs in the browser.
