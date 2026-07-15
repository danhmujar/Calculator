# Changelog Popup Once On Update — Design Spec

**Date:** 2026-07-15
**Status:** Approved
**Feature:** Changelog pop-up that appears once on a new update

## Summary

When a new update takes place, a glassmorphic "What's New" modal pops up once on page load. It dynamically fetches release details from a JSON file and tracks whether the user has already seen it using `localStorage`.

## Requirements

- Fetches changelog details dynamically from a `public/changelog.json` file
- Appears once on page load for returning users after an update
- Silent initialization for first-time visitors (stores version but does not pop up)
- Reuses the accessible, glassmorphic styles of the `AboutModal`
- Handles focus trapping, keyboard navigation, Escape key close, and screen reader announcements
- Writes the newly-seen version to `localStorage` (key: `lastSeenChangelogVersion`) once closed

## JSON Schema (`public/changelog.json`)

```json
{
  "version": "1.1.0",
  "date": "2026-07-15",
  "features": [
    "Added inline row naming for scientific rows",
    "Added hover-to-copy button on the main display"
  ],
  "improvements": [
    "Extracted display and row managers for improved modularity",
    "Optimized service worker and manifest caching"
  ]
}
```

## DOM Structure

```html
<div
  class="about-overlay"
  id="changelog-overlay"
  role="dialog"
  aria-modal="true"
  aria-labelledby="changelog-heading"
  aria-hidden="true"
>
  <div class="about-modal">
    <!-- Close X -->
    <button
      class="about-close-x"
      id="changelog-close-x"
      title="Close"
      aria-label="Close changelog dialog"
    >
      <svg width="16" height="16" aria-hidden="true">
        <use xlink:href="./assets/sprites.svg#icon-x"></use>
      </svg>
    </button>

    <div class="about-modal-inner">
      <!-- Header -->
      <div class="about-header">
        <h2 id="changelog-heading">What's New in v1.1.0</h2>
      </div>

      <!-- Dynamic Content -->
      <div id="changelog-content" class="changelog-content">
        <!-- Injected list structures -->
      </div>

      <!-- Got it Button -->
      <button
        class="add-math-btn"
        id="changelog-ok-btn"
        style="margin-top: 1.5rem; width: 100%;"
      >
        Got it, thanks!
      </button>
    </div>
  </div>
</div>
```

## Class & Logical Flow (`ChangelogModal`)

### Initialization (`ui/ui.js`):

1. On `DOMContentLoaded`, fetch `/changelog.json?t=Date.now()`.
2. Check `lastSeenChangelogVersion` in `localStorage`.
3. If `lastSeenChangelogVersion` is `null` (first-time user):
   - Set `localStorage.setItem('lastSeenChangelogVersion', changelog.version)`.
   - Do not display the modal.
4. If `changelog.version` is newer or different from `lastSeenChangelogVersion`:
   - Inject headings and bullet points into `#changelog-content`.
   - Update `#changelog-heading` text to `"What's New in v" + changelog.version`.
   - Call `this.open()` to show the overlay and trap focus.
5. If versions match, do nothing.

### Closing:

When close triggers (clicking Close X, clicking OK, clicking overlay backdrop, or pressing Escape):

1. Hide the overlay.
2. Restore focus to the last active element.
3. Save the new version: `localStorage.setItem('lastSeenChangelogVersion', changelog.version)`.

## Styles (`ui/styles.css`)

Since we reuse the base class `about-overlay` and `about-modal` style sheets, we only need basic styling for the list layout:

- Style headings inside `.changelog-content` (e.g., `.changelog-section-title`).
- Style list elements and bullet points.

## Accessibility

- Natively focusable controls (`button`, close-x)
- Active focus trap when modal is open
- Backdrops and main layout elements marked `inert` during display
- Escape key listener bound on open, removed on close

## Testing

- Verify first-time visitors don't get the popup but get their localStorage initialized.
- Verify changing the version in `changelog.json` causes the popup to appear once on the next refresh.
- Verify closing the popup saves the version and does not show it again on refresh.
- Verify Escape key, clicking Close X, or clicking the background closes the modal.
- Verify focus starts on "Got it, thanks!" and is trapped.
