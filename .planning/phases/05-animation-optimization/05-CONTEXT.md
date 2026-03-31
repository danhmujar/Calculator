# Phase 05: Animation Optimization

## Context
This phase focuses on optimizing the calculator's animation performance, specifically targeting CSS-variable driven eye-tracking and rendering loops to ensure consistent 60fps on low-end devices.

## Objectives
- [ ] [P5-T1] CSS-Variable Eye-Tracking Refinement: Optimize the pupil positioning logic and transition properties for better hardware acceleration.
- [ ] [P5-T2] Canvas Rendering Optimization: Profile the display rendering and implement frame-skipping or dirty-rect rendering if needed.
- [ ] [P5-T3] Transition Performance: Audit all CSS transitions and animations to ensure they only use `transform` and `opacity`.

## Success Criteria
- [ ] Smooth 60fps animation during interactivity on target devices.
- [ ] Zero layout thrashing during pupil movement.
- [ ] Reduced main-thread usage during peak animation.
