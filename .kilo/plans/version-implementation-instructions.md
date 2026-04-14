# Implementation Instructions for Version Display in About Modal

## Step 1: Modify index.html

In the index.html file, locate the section for the about modal (around line 840-860). Find the install button section and add the version display element after it:

```html
<button class="about-install-btn" id="pwa-install-btn" hidden>
  <svg width="16" height="16" aria-hidden="true">
    <use xlink:href="./assets/sprites.svg#icon-download"></use>
  </svg>
  Install App
</button>
<div
  class="about-version"
  id="app-version"
  style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);"
></div>
```

## Step 2: Update ui.js

In the ui.js file, modify the AboutModal class to include version fetching functionality. Add the following code to the class:

```javascript
// Add this method to the AboutModal class
async fetchAndDisplayVersion() {
  try {
    const response = await fetch('./version.json');
    const versionData = await response.json();
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
      versionElement.textContent = `Version: ${versionData.version}`;
    }
  } catch (error) {
    console.error('Error fetching version:', error);
  }
}

// Modify the open() method to call fetchAndDisplayVersion
open() {
  this.previouslyFocused = document.activeElement;
  this.overlay.classList.add('open');
  this.overlay.setAttribute('aria-hidden', 'false');
  this.modal.setAttribute('aria-labelledby', 'about-heading');
  document.body.style.overflow = 'hidden';

  document
    .querySelectorAll('.layout-container, .mobile-panel-fab, .about-fab')
    .forEach((el) => {
      el.setAttribute('inert', '');
    });

  this.escapeHandler = (e) => {
    if (e.key === 'Escape' && this.overlay.classList.contains('open')) {
      this.close();
    }
  };
  document.addEventListener('keydown', this.escapeHandler);

  // Add version fetching when opening the modal
  this.fetchAndDisplayVersion();

  setTimeout(() => this.closeX.focus(), this.FOCUS_DELAY_MS);
}
```

## Step 3: Test the Implementation

1. Open the application in a browser
2. Click the "About" button to open the about modal
3. Verify that the version is displayed at the bottom of the modal
4. Check that the version matches what's in the version.json file

## Additional Notes

- The version display will automatically fetch the current version from version.json
- The version display will appear at the bottom of the about modal
- If there are any issues with fetching the version, they will be logged to the console
