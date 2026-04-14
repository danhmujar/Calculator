# Plan for Version Display in About Modal

## Goal

Add version display to the about modal that shows the current application version.

## Implementation Steps

1. Modify index.html to add version display element in the about modal
2. Update ui.js to include version fetching and display logic
3. Ensure the version is displayed when the about modal is opened

## Details

### 1. HTML Changes

- Add a div with id "app-version" in the about modal section of index.html
- This div will display the current version information

### 2. JavaScript Changes

- Add a function to fetch version from version.json
- Add event listener to update version display when about modal is opened
- Add version display logic to show in the about modal

### 3. Specific file modifications

#### index.html

```html
<!-- Add this in the about modal section -->
<div class="about-version" id="app-version"></div>
```

#### ui.js

```javascript
// Add version fetching function
async function fetchAndDisplayVersion() {
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

// Call this when about modal is opened
```

## Implementation

1. First, I'll add the version display element to the about modal in index.html
2. Then, I'll add JavaScript code to fetch and display the version when the about modal is opened
3. Finally, I'll ensure the version is properly updated and displayed
