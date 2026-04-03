# Research Synthesis

## Overview
The goal of shifting from a CSS-heavy backdrop blur/gradient implementation to a hardware-accelerated WebGL composited architecture is optimal for long-term performance. The research concludes that a flat architecture—raw WebGL 2.0 (without massive libraries like Three.js)—operating strictly strictly as an underlay is heavily favored for PWAs.

## Core Recommendations for Planning Phase
1. **Z-Index Strategy**: The most lethal pitfall identified is stacking context resets caused by the scientific mode toggle. The roadmap *must* dedicate a phase precisely to establishing a flat `z-index` sibling relationship between the DOM `<main>` layout and the `<canvas>`.
2. **Ping-Pong Buffer implementation**: Ensure the blur pass accurately relies on two FBOs swapping states to prevent WebGL black screens.
3. **Event Independence**: Isolate pointer-events and keep state strictly one-directional: interactions hit the DOM, DOM updates trigger the WebGL states, WebGL renders passively.

Overall, finalize the infrastructure incrementally, tackling the Canvas setup first, the multipass composition second, and integrating the UI correctly last.
