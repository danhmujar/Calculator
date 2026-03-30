# Research Summary: Optimized Vanilla JS Calculator

**Domain:** Educational Tools / Math Utility
**Researched:** 2024-03-29
**Overall confidence:** HIGH

## Executive Summary

The project aims to build a high-performance math calculator using Vanilla JS and Vite, leveraging the precision of Math.js and the advanced formula editing of MathLive. Research indicates that while these libraries are powerful, they are heavy and can negatively impact performance if loaded statically. The optimal path involves lazy loading, custom bundling, and strict DOM update patterns.

## Key Findings

**Stack:** Vite + Vanilla JS + Math.js (Custom Bundle) + MathLive (Lazy Loaded).
**Architecture:** State-driven UI with `requestAnimationFrame` and the Command Pattern for undo/redo history.
**Critical pitfall:** Loading the full `mathjs` and `mathlive` libraries upfront, which can exceed 1MB and delay Time to Interactive (TTI).

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase 1: Performance-First Architecture** - Build the state management and rendering pipeline using `requestAnimationFrame` and event delegation.
   - Addresses: DOM Manipulation Efficiency.
   - Avoids: Layout thrashing.

2. **Phase 2: Math Engine Integration** - Set up the math engine with tree-shaken `mathjs/number` and custom dependencies.
   - Addresses: Math.js bundle size.

3. **Phase 3: Advanced UI & Formula Editor** - Integrate MathLive via lazy loading to prevent initial load bloat.
   - Addresses: MathLive size and FOUC.

4. **Phase 4: Offline PWA** - Configure `vite-plugin-pwa` for reliable offline math calculations.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Standard high-performance Vite/Vanilla setup. |
| Features | HIGH | Standard calculator requirements with formula editing. |
| Architecture | MEDIUM | Requires careful implementation of the Command pattern. |
| Pitfalls | HIGH | Library bloat is a well-documented risk. |

## Gaps to Address

- **MathLive CDN usage:** The user mentioned CDN-loaded libraries. Using CDN versions (`<script src="...">`) bypasses Vite's tree-shaking and chunking. Recommendation: Use npm packages with Vite instead of direct CDN links to allow for better optimization and PWA precaching.
- **MathLive Fonts:** Need to ensure fonts load without flicker when using the lazy-loaded Web Component.
