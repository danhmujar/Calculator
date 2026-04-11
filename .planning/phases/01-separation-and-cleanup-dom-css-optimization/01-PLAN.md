---
wave: 1
depends_on: []
files_modified: ['index.html', 'ui/styles.css']
autonomous: true
---

# Objective

Separate the WebGL `<canvas>` into an isolated stacking context as a direct sibling to `<main>` and completely eliminate legacy CSS `backdrop-filter` compositing to prevent z-index regressions.

## Requirements Addressed

- REQ-1 (Remove CSS Composition)
- REQ-2 (Architecture Separation)

<task>
  <read_first>
    - index.html
    - .planning/phases/01-separation-and-cleanup-dom-css-optimization/01-RESEARCH.md
  </read_first>
  <action>
    Modify `index.html` to establish strict flat sibling relationships:
    1. Locate the `<canvas id="webgl-underlay">` element.
    2. Move the `<canvas>` to be the first direct child of `<body>`, completely outside of the `<main class="calculator-ui">` and any of its wrapper `<div>` tags.
    3. Ensure the `<canvas>` retains the `aria-hidden="true"` attribute.
    4. Remove any `.webgl-container` wrapping `<div>` elements if they exist and are no longer required due to this flattening.
  </action>
  <acceptance_criteria>
    - `grep -A 2 "<body>" index.html` shows `<canvas id="webgl-underlay"` immediately following the body tag.
    - The `<canvas>` is strictly NOT nested inside `<main>`.
  </acceptance_criteria>
</task>

<task>
  <read_first>
    - ui/styles.css
    - .planning/phases/01-separation-and-cleanup-dom-css-optimization/01-CONTEXT.md
  </read_first>
  <action>
    Modify `ui/styles.css` to purge compositing traps and initialize the canvas:
    1. Delete ALL instances of `backdrop-filter: blur(...)` across the entire stylesheet (specifically check `.calculator-ui`, `.card`, and `.result-group`).
    2. Delete ALL instances of `mix-blend-mode` across the stylesheet.
    3. Add a new explicit CSS block for `#webgl-underlay` with the following rules:
       ```css
       #webgl-underlay {
         position: fixed;
         inset: 0;
         width: 100vw;
         height: 100vh;
         z-index: -1;
         pointer-events: none;
       }
       ```
    4. Ensure `.calculator-ui` has a `z-index` of 1 or greater so it explicitly stacks over the canvas.
  </action>
  <acceptance_criteria>
    - `grep "backdrop-filter" ui/styles.css` returns empty (0 matches).
    - `grep -A 7 "#webgl-underlay" ui/styles.css` shows `pointer-events: none;` and `z-index: -1;`.
  </acceptance_criteria>
</task>

## Verification

- Run `npm run dev` and visually inspect the calculator. The UI must remain clickable (the canvas cannot block pointer events).
- Inspect the DOM tree in DevTools: The `<canvas>` must be a direct sibling of `<main>`.
- The WebGL flat background colors must be visible beneath the calculator layout.

## Must Haves

- Unbroken Layout Grid: The actual calculator grid and spacing parameters must not shift or break due to the DOM extraction.
