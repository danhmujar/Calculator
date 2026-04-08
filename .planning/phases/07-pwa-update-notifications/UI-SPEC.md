# UI-SPEC.md: Phase 07 - PWA Update Notifications

**Status:** draft
**Phase:** 07 - pwa-update-notifications
**Design System:** Aurora UI (Glassmorphism + Bento)

## Design Contract Summary

This phase introduces a non-intrusive toast notification for PWA updates. It must adhere to the existing Aurora color palette and glassmorphic aesthetic.

### Spacing
- Scale: Standard 8-point system (4, 8, 16, 24).
- Toast Padding: 16px.
- Gap between actions: 8px.
- Corner Radius: 12px (rounded).

### Typography
- Body size: 14px.
- Weight: Regular (400) + Semibold (600) for CTA.
- Line Height: 1.5.

### Color
- Surface: Glassmorphic background (Aurora tint, opacity 0.8, backdrop-blur 12px).
- Border: 1px subtle white/semi-transparent (to define the glass edge).
- Accent: Reserved for primary action (Update).
- Destructive: N/A (Dismiss is neutral).

### Copywriting
- Toast Message: "A new version of the calculator is available."
- Primary CTA: "Update Now"
- Dismiss Action: "Later"

### Registry
- `workbox-window`: Standard library, vetted for PWA update management.

---

## Component Specs

### UpdateToast
- **Type**: Fixed-position notification (bottom-center or bottom-right).
- **Behavior**: Appears only when a new service worker is in `waiting` state.
- **Interaction**:
  - `Update`: Triggers `skipWaiting()` and hard page reload.
  - `Dismiss`: Hides the toast until the next refresh.
- **Visuals**:
  - Background: `rgba(255, 255, 255, 0.1)` (or theme-matched Aurora base).
  - Blur: `backdrop-filter: blur(12px)`.
  - Border: `1px solid rgba(255, 255, 255, 0.2)`.

## Safety Gate
- `workbox-window` vetted: standard ecosystem usage, no suspicious network patterns.
