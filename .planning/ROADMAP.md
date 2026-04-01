# Roadmap: Calculator Architectural Hardening & WebGL Migration

## Phases

- [x] **Phase 1: Performance-First Core** - Establish efficient state management and core rendering foundations.
- [x] **Phase 2: Asset & Build Modernization** - Reduce file sizes and automate build/PWA pipeline.
- [x] **Phase 3: Library & Event Optimization** - Fine-tune interactions and third-party library usage.
- [x] **Phase 4: Final Validation & Polish** - Ensure fidelity to original logic and UI.
- [x] **Phase 5: Animation Optimization** - Refine hardware-accelerated animations and rendering.
- [x] **Phase 6: Architectural Hardening** - Refactor monolithic application layer and resolve all core technical debt.
- [x] **Phase 7: WebGL 2.0 Core & Primitive Rendering** - Initialize raw WebGL 2.0 context and render UI primitives.
- [ ] **Phase 8: Advanced WebGL Typography & Texturing** - Implement glyph atlas for MathLive/KaTeX and render math expressions.
- [ ] **Phase 9: High-Performance Batching & State Sync** - Implement batch renderer and synchronize WebGL with the modular store.
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
**Goal**: Initialize a raw WebGL 2.0 rendering pipeline and render basic UI components.
**Depends on**: Phase 6
**Requirements**: REQ-WGL-01, REQ-WGL-02, REQ-WGL-03
**Success Criteria** (what must be TRUE):
  1. **Context**: A WebGL 2.0 canvas is initialized and integrated into the `UIManager`.
  2. **Shaders**: Custom GLSL shaders render primitive shapes (buttons, backgrounds) with high precision using SDFs.
  3. **Buffers**: Dynamic vertex buffers efficiently update to reflect calculator layout changes using VAOs and Buffer Orphaning.
  4. **Verifiability**: Running `npm run dev` shows WebGL-rendered primitives alongside the existing DOM UI.
**Plans**: 4 plans
- [x] 07-01-PLAN.md — WebGL Foundation & Context Initialization
- [x] 07-02-PLAN.md — Shader Infrastructure & SDF Primitives
- [x] 07-03-PLAN.md — Dynamic Buffer Management & Integration
- [x] 07-04-PLAN.md — Coordinate Synchronization & Underlay Integration
**UI hint**: yes

### Phase 8: Advanced WebGL Typography & Texturing
**Goal**: Implement hardware-accelerated text rendering for complex mathematical expressions.
**Depends on**: Phase 7
**Requirements**: REQ-WGL-04, REQ-WGL-05
**Success Criteria** (what must be TRUE):
  1. **Texture Atlas**: A dynamic glyph atlas is generated for MathLive/KaTeX symbols.
  2. **Text Rendering**: Scientific rows render their expressions via WebGL textures with perfect visual parity to the original KaTeX output.
  3. **Verifiability**: The user can manually toggle between DOM text and WebGL text for side-by-side comparison.
**Plans**: 4 plans
- [x] 08-01-PLAN.md — Dynamic Texture Atlas Generation (Canvas-based SDF)
- [ ] 08-02-PLAN.md — MathLive/KaTeX Layout Synchronization (Shadow DOM traversal)
- [ ] 08-03-PLAN.md — Advanced Batch Renderer & Unified Shader (mixed primitives + text)
- [ ] 08-04-PLAN.md — Integration, Verification Toggle, and Performance Tuning
**UI hint**: yes

### Phase 9: High-Performance Batching & State Sync
**Goal**: Optimize rendering performance through batching and full state synchronization.
**Depends on**: Phase 8
**Requirements**: REQ-WGL-06, REQ-TEST-02
**Success Criteria** (what must be TRUE):
  1. **Batching**: A custom batch renderer minimizes draw calls, enabling 60 FPS with 100+ scientific rows.
  2. **Sync**: WebGL state is synchronized in real-time with the modular `CalculatorService` and `Store`.
  3. **Animations**: UI transitions and layout shifts are interpolated on the GPU.
  4. **Stress Tested**: Performance stress tests confirm stability under heavy load.
**Plans**: TBD
**UI hint**: yes

### Phase 10: Full Migration & Final Verification
**Goal**: Complete the migration by removing legacy DOM rendering and performing final quality audits.
**Depends on**: Phase 9
**Requirements**: REQ-VER-01, REQ-VER-02, REQ-VER-03
**Success Criteria** (what must be TRUE):
  1. **Clean Swap**: The legacy DOM rendering layer is removed; the app runs 100% on Raw WebGL 2.0.
  2. **Visual Parity**: Manual audit confirms zero visual regressions across all calculator modes.
  3. **Input Parity**: Touch and gesture interactions are fully verified on physical mobile devices.
  4. **Final Verification**: App passes all UAT criteria in a fully "Runnable" state.
**Plans**: TBD
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
| 8. WebGL Typography | 0/4 | Not started | - |
| 9. Performance Batching | 0/1 | Not started | - |
| 10. Final Verification | 0/1 | Not started | - |
