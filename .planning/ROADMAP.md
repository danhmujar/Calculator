# Roadmap: Calculator Architectural Hardening & WebGL Migration

## Phases

- [x] **Phase 1: Performance-First Core** - Establish efficient state management and core rendering foundations.
- [x] **Phase 2: Asset & Build Modernization** - Reduce file sizes and automate build/PWA pipeline.
- [x] **Phase 3: Library & Event Optimization** - Fine-tune interactions and third-party library usage.
- [x] **Phase 4: Final Validation & Polish** - Ensure fidelity to original logic and UI.
- [x] **Phase 5: Animation Optimization** - Refine hardware-accelerated animations and rendering.
- [x] **Phase 6: Architectural Hardening** - Refactor monolithic application layer and resolve all core technical debt.
- [x] **Phase 7: WebGL 2.0 Core & Primitive Rendering** - Initialize raw WebGL 2.0 context and render UI primitives.
- [x] **Phase 8: Advanced WebGL Typography & Texturing** - Implement glyph atlas for MathLive/KaTeX and render math expressions.
- [x] **Phase 9: High-Performance Batching & State Sync** - Implement batch renderer and synchronize WebGL with the modular store.
- [ ] **Phase 10: Full Migration & Final Verification** - Complete the swap to WebGL and perform final manual parity audits.

---

## Phase Details

### Phase 1: Performance-First Core
**Status**: COMPLETED

### Phase 2: Asset & Build Modernization
**Status**: COMPLETED

### Phase 3: Library & Event Optimization
**Status**: COMPLETED

### Phase 4: Final Validation & Polish
**Status**: COMPLETED

### Phase 5: Animation Optimization
**Status**: COMPLETED

### Phase 6: Architectural Hardening
**Status**: COMPLETED

### Phase 7: WebGL 2.0 Core & Primitive Rendering
**Status**: COMPLETED

### Phase 8: Advanced WebGL Typography & Texturing
**Status**: COMPLETED

### Phase 9: High-Performance Batching & State Sync
**Status**: COMPLETED

### Phase 10: Full Migration & Final Verification
**Goal**: Complete the migration by removing legacy DOM rendering and performing final quality audits.
**Depends on**: Phase 9
**Requirements**: REQ-VER-01, REQ-VER-02, REQ-VER-03, REQ-TEST-01, REQ-TEST-02
**Success Criteria** (what must be TRUE):
  1. **Clean Swap**: The legacy DOM rendering layer is removed; the app runs 100% on Raw WebGL 2.0.
  2. **Visual Parity**: Manual audit confirms zero visual regressions across all calculator modes.
  3. **Input Parity**: Touch and gesture interactions are fully verified on physical mobile devices.
  4. **Final Verification**: App passes all UAT criteria in a fully "Runnable" state.
**Plans**: 3 plans
- [ ] 10-01-PLAN.md — Legacy Code Removal & Asset Cleanup
- [ ] 10-02-PLAN.md — Cross-Platform & Mobile Parity Audit
- [ ] 10-03-PLAN.md — Final UAT & Project Delivery (VERIFICATION.md)
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Performance-First Core | 3/3 | COMPLETED | 2024-03-29 |
| 2. Asset & Build Modernization | 3/3 | COMPLETED | 2024-03-30 |
| 3. Library & Event Optimization | 3/3 | COMPLETED | 2024-03-30 |
| 4. Final Validation & Polish | 3/3 | COMPLETED | 2024-03-31 |
| 5. Animation Optimization | 1/1 | COMPLETED | 2024-03-31 |
| 6. Architectural Hardening | 5/5 | COMPLETED | 2024-04-01 |
| 7. WebGL 2.0 Core & Primitive Rendering | 4/4 | COMPLETED | 2026-04-01 |
| 8. WebGL Typography | 4/4 | COMPLETED | 2026-04-01 |
| 9. Performance Batching | 5/5 | COMPLETED | 2026-04-01 |
| 10. Final Verification | 0/3 | Not started | - |
