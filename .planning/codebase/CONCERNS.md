# Concerns

## Technical Debt & Areas of Improvement

- **Precision Limits**: Mathematical evaluations rely on standard IEEE 754 floats or `math.js` defaults. Long or complex trailing precision problems could manifest in edge cases.
- **Service Worker Lifecycle**: The PWA uses Vite-PWA with `prompt` update types. Stale cache invalidation can sometimes be tricky for end-users without aggressive refresh prompts.
- **Large UI File Size**: `index.html` is somewhat large (~440 lines). Inline SVGs bloat the source. Extracting SVGs completely into external sprites/components could organize the HTML further.
- **Testing**: Sole reliance on E2E (Playwright) over Unit Tests makes discovering simple JS logic regressions slower and more resource-intensive compared to running localized isolated script tests.

## Security

- While XSS is mitigated through direct `textContent` and `createElement` methods, dynamic injection of user formulas via MathLive requires constant validation to ensure arbitrary expressions are not improperly evaluated.
