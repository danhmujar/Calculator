# Phase 06: Architectural Hardening - Validation

This document defines the validation criteria for Phase 06: Architectural Hardening, ensuring all architectural, security, and performance goals are met.

## Requirement Coverage

| ID | Requirement | Validation Method |
|----|-------------|-------------------|
| REQ-ARCH-01 | App logic is modularized | Static analysis: Check `services/app.js` for orchestration logic only; verify `UIManager.js`, `CalculatorService.js`, `PWAManager.js`, and `EventManager.js` existence. |
| REQ-ARCH-02 | LRU Cache for text measurements | Performance test: `tests/performance.spec.js` verifies cache eviction and memory stability. |
| REQ-ARCH-03 | Modular PWA Logic | Unit test/Manual: Verify `services/pwa.js` handles SW registration and install events. |
| REQ-STORE-01 | O(1) State Reads | Performance test: `tests/state.spec.js` verifies Proxy-based read performance and structural sharing. |
| REQ-STORE-02 | State Segmentation | Unit test: `services/store.js` tests verify `persistent` vs `transient` segmentation and selective persistence. |
| REQ-BUG-01 | Event-driven MathLive init | E2E test: `tests/scientific.spec.js` verifies row restoration without `setTimeout`. |
| REQ-BUG-02 | Reliability on mobile | E2E test: Playwright mobile emulation tests for scientific row restoration. |
| REQ-BUG-03 | Stable row state | Unit/E2E: Verify row state consistency after multiple operations and refreshes. |
| REQ-SEC-01 | Secure MathJS config | Security test: `tests/security.spec.js` verifies blocked functions and restricted settings. |
| REQ-SEC-02 | MathJS AST protection | Security test: `tests/security.spec.js` verifies `AccessorNode` blocking (prototype pollution protection). |
| REQ-TEST-01 | Unit test coverage | Code coverage: Ensure new services have corresponding `.spec.js` files with >80% coverage. |

## Success Criteria Verification

### 1. Modularity
- [ ] `services/app.js` contains no direct DOM manipulation or business logic.
- [ ] `services/app.js` initializes and coordinates external services.
- [ ] All global events are managed by `EventManager`.

### 2. State Efficiency
- [ ] `services/store.js` implements Copy-on-Write via Proxy.
- [ ] Reference equality is maintained for unchanged state branches.
- [ ] LocalStorage contains only `persistent` state segment.

### 3. Reliability
- [ ] Scientific rows restore correctly 100% of the time in E2E tests.
- [ ] No `setTimeout` or `SCI_RESTORE_DELAY_BASE_MS` found in restoration logic.

### 4. Security
- [ ] No `innerHTML` assignments found in `ui/` directory.
- [ ] `mathjs` evaluation throws on `[].constructor` or similar accessor patterns.
- [ ] High-risk `mathjs` functions (`import`, `evaluate`, etc.) are disabled.

### 5. Performance
- [ ] `LRUCache` in `renderer.js` evicts items when capacity is reached.
- [ ] Text measurement overhead is minimized via cache hits.

## Automated Verification Suite

Run all tests:
```bash
npm test
```

Individual test files:
- `tests/state.spec.js`: State management & performance.
- `tests/security.spec.js`: MathJS security & AST blocking.
- `tests/scientific.spec.js`: MathLive initialization & restoration.
- `tests/performance.spec.js`: LRU Cache & measurement performance.
- `services/calculator.spec.js`: Calculation logic & scope.
