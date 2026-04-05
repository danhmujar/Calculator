---
status: draft
---

# UI Specification: Phase 06 - implement-bts-theme

## 1. Design System State
- **Library:** Custom (Vanilla JS/CSS + WebGL) *(Pre-populated from codebase scan)*
- **Tokens:** CSS Custom Properties defined in `ui/styles.css` *(Pre-populated from codebase scan)*
- **Preset:** None

## 2. Visual Contract

### 2.1 Spacing & Layout
- **Scale:** 8-point scale (4, 8, 16, 24, 32, 48, 64) *(Default)*
- **Layout Patterns:** Standard DOM UI overlaid on WebGL Canvas. Theme picker requires a new swatch layout integration. *(Source: CONTEXT.md)*

### 2.2 Typography
- **Font Sizes:** 14px, 16px, 20px, 28px *(Default/Existing CSS)*
- **Font Weights:** 400 (regular), 600 (semibold) *(Default/Existing CSS)*
- **Line Height:** 1.5 for body, 1.2 for headings *(Default)*

### 2.3 Color Palette
- **Dominant (60%):** Deep Purple (`#8A2BE2`) - BTS Signature Color *(Source: CONTEXT.md)*
- **Secondary (30%):** Dark space background for Dark Mode/Aurora (`#0d0614` or similar), Light fallback background (`#F1EDFC` or similar for light mode) *(Source: CONTEXT.md)*
- **Accent (10%):** Lighter Purple (`#9D00FF`) for highlights, interactions, and "shining stars" effect *(Source: CONTEXT.md)*

### 2.4 Assets & Imagery
- **Foreground Animation:** `bts-chibi.gif` (triggers when the user clicks the theme) *(Source: CONTEXT.md)*
- **Background Asset:** `bts_chibi_bg...png` integrated directly into the background of the calculator *(Source: CONTEXT.md)*
- **Visual Effects:** Overlaid with an animated "shining stars" effect across the background to enhance the cosmic BTS aesthetic *(Source: CONTEXT.md)*

## 3. Component Details
- **Theme Picker:** Add a new swatch for the BTS theme in the `.theme-picker` dropdown. *(Source: CONTEXT.md)*
- **WebGL Aurora Theme:** Register `theme-aurora-bts` in `VALID_THEMES` and set the `#8A2BE2` uniform in `renderer.js`. *(Source: CONTEXT.md)*
- **Light Mode Fallback:** Implement static CSS fallback for light mode since Aurora forces dark mode. *(Source: CONTEXT.md)*

## 4. Copywriting
- **Primary CTA:** N/A (Theme selection is the primary action)
- **Empty State:** N/A
- **Error State:** N/A
- **Destructive Actions:** None

## 5. Registry/Dependencies
- **Third-party Registries:** None (Vanilla implementation)
- **Safety Gate:** Passed - view passed - no flags (Not applicable, no third-party code)