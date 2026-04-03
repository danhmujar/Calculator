# Testing

## Frameworks
- **Playwright (`@playwright/test`)**: End-to-end and integration testing. Capable of asserting DOM states, UI flows, and mathematical outcomes rendered to the user.
- **Axe-core (`@axe-core/playwright`)**: Accessibility testing ensuring the UI continues to meet WCAG standards.

## Structure
- UI testing ensures that switching themes, calculating values, saving history rows, and navigating between responsive layouts correctly function.
- Tests assert state persistence directly by managing browser context and loading the `localStorage` payload.

## Coverage
- Broad E2E paths covering functionality. No standalone unit-test suite exists (e.g., Jest/Mocha). Playwright scripts test the DOM + Core Logic integratively.
