# Scientific Mode Input Enhancement & Excel Copy — Design Spec

**Date:** 2026-07-20
**Status:** Completed
**Features:**

1. Formatted Number Filter on Paste (stripping spaces/commas in formatted numbers, preserving function arguments)
2. Copy Row Expression as Excel-Compatible Formula

---

## 1. Summary

Enhance the Scientific (SCI) mode math fields with two major user experience upgrades:

- Automatically filter out formatted spacing and thousands-separator commas when pasting strings into scientific row `<math-field>` elements, preventing syntax errors while preserving standard function parameters.
- Provide a dedicated "Copy Excel Formula" button in each math row that translates the current ASCII-math expression into a fully uppercase, Excel-compliant formula, complete with `=` prefixing and Excel function mappings.

---

## 2. Technical Requirements

### Feature 1: Paste Event Interception & Filter

- **Listener Target:** Hook into the native `'paste'` event on the dynamically created `<math-field>` custom element in `ui/math-field-controller.js`.
- **Interception:**
  - Retrieve text from `e.clipboardData.getData('text/plain')`.
  - Cancel standard paste event via `e.preventDefault()`.
  - Apply the number-filtering sanitization algorithm.
  - Insert the clean expression into the cursor position using MathLive's native `mf.insert(filteredText)` API.
- **Sanitization Patterns:**
  - **Digit Space Stripper:** Strip spaces that exist strictly between digits (e.g., `1 234 567` $\to$ `1234567`). Keep spaces around operations (e.g., `123 + 456`) and function parameters (e.g., `min(1, 2)`).
    - Regex: `/(?<=\d)\s+(?=\d)/g`
  - **Thousands Comma Stripper:** Strip commas that are preceded by a digit and followed immediately by exactly 3 digits, ending in either a non-digit character or end-of-string (e.g., `12,345,678.90` $\to$ `12345678.90`). Leave parameter commas (e.g., `sum(1, 2)`) intact.
    - Regex: `/(?<=\d),(?=\d{3}(?:\D|$))/g`

### Feature 2: Excel Formula Copying

- **UI Button:** Add a dedicated `.excel-copy-btn` in the `.math-actions` list of each row instance (next to the standard Copy Result button).
- **Aesthetic:** Reuse standard `.icon-btn` styling. Include an inline SVG depicting a spreadsheet grid to clearly distinguish it from other copy buttons.
- **Accessibility:**
  - `title="Copy as Excel formula"`
  - `aria-label="Copy row expression as Excel formula"`
  - Standard focus outlines and Tab navigation behaviors.
- **Translation Rules (`ui/clipboard-manager.js`):**
  - Prefix with `=`.
  - Convert standard functions to uppercase: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `log`, `ln`, `abs` $\to$ `SIN`, `COS`, `TAN`, etc.
  - Convert mathematical constants:
    - `pi` $\to$ `PI()`
    - `e` $\to$ `EXP(1)`
  - Ignore empty expressions or output descriptive toast notifications.

---

## 3. DOM & Styling Structures

### Row Structure (`ui/math-field-controller.js`):

We will expand the row actions append logic:

```html
<div class="math-actions">
  <span class="math-result" id="result-[id]">= </span>
  <button class="icon-btn" title="Copy result">...</button>
  <button
    class="icon-btn excel-copy-btn"
    title="Copy as Excel formula"
    aria-label="Copy row expression as Excel formula"
  >
    <!-- SVG Grid Spreadsheet Icon -->
  </button>
  <button class="icon-btn delete-row-btn" title="Delete row">...</button>
</div>
```

### SVG Icon Markup:

We will draw a clean 16x16 spreadsheet grid icon natively:

```html
<svg
  width="16"
  height="16"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  <line x1="3" y1="9" x2="21" y2="9"></line>
  <line x1="3" y1="15" x2="21" y2="15"></line>
  <line x1="12" y1="3" x2="12" y2="21"></line>
</svg>
```

---

## 4. Logical Flow & Classes

### 1. `ClipboardManager` Extension (`ui/clipboard-manager.js`)

We will add `copyExcelFormula(mathFieldElement)` and a mapping function:

```javascript
translateToExcelFormula(expr) {
  if (!expr) return '';
  let excel = expr.trim();

  // 1. Function Uppercasing
  const standardFunctions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'log', 'ln', 'abs'];
  standardFunctions.forEach(fn => {
    const regex = new RegExp(`\\b${fn}\\(`, 'gi');
    excel = excel.replace(regex, `${fn.toUpperCase()}(`);
  });

  // 2. Constants Mapping
  excel = excel.replace(/\bpi\b/gi, 'PI()');
  excel = excel.replace(/\be\b/gi, 'EXP(1)');

  // 3. Formula Equation Prefix
  if (!excel.startsWith('=')) {
    excel = '=' + excel;
  }
  return excel;
}
```

### 2. `MathFieldController` Binding (`ui/math-field-controller.js`)

- Attach the paste interceptor within `createMathField()`.
- Bind click events on `.excel-copy-btn` to call `this.clipboardManager.copyExcelFormula(mf)`.

---

## 5. Verification Plan

### Manual & Automated Test Scenarios:

1. **Paste Sanitization Verify:**
   - Paste `1,234.56 + 5 678` $\to$ Should evaluate as `1234.56 + 5678` successfully.
   - Paste `min(2, 3)` $\to$ Should keep comma and evaluate correctly (no error).
   - Paste `max(1,234, 5,678)` $\to$ Should correctly clean the formatted numbers to `max(1234, 5678)` and preserve the separator comma.

2. **Excel Copy Verify:**
   - Write `sin(pi) + sqrt(16)` into field and click Copy Excel button.
   - Clipboard must hold `=SIN(PI()) + SQRT(16)`.
   - Verify success toast notification triggers.

---

## 6. Implementation & Verification Report

### Files Modified & Created:

- **`ui/clipboard-manager.js`**: Implemented `copyExcelFormula(mf)` and `translateToExcelFormula(expr)`.
- **`ui/math-field-controller.js`**: Hooked standard `paste` listener inside `createMathField()`. Added `.excel-copy-btn` next to Copy Result inside `createMathActions(uniqueId, rowEl, mf)`.
- **`ui/styles.css`**: Styled `.excel-copy-btn:hover` to transition to Excel green `#107c41`.
- **`ui/clipboard-manager.test.js`** (new): Added full unit test coverage for translation rules and edge cases.

### Verification Results:

- **Unit Tests (`npm run test:unit`)**: All 18 unit tests passed successfully, confirming perfect translation behaviors.
- **Linter (`npm run lint`)**: Checked and verified with zero errors or warnings inside the modified scope.
- **Production Build (`npm run build`)**: Bundled successfully, generating complete PWA distribution files in `dist/`.
