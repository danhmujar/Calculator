# Project Research: Pitfalls

## 1. The Stacking Context Trap
**Warning Sign**: The WebGL layer suddenly jumps *in front* of the DOM or standard UI elements disappear when the Scientific Mode expands.
**Cause**: CSS properties like `transform`, `opacity`, or `filter` on a parent DOM layer create a new "Stacking Context", severing standard z-index relations.
**Prevention**: Ensure the WebGL `<canvas>` and the DOM wrapper `<main>` are siblings inside a flat stacking layer. Never apply transforms to the wrapper holding the canvas once z-indexes are initialized.

## 2. Pointer Events Blockade
**Warning Sign**: Buttons on the calculator stop responding to clicks/touches.
**Cause**: The Canvas overlays the UI or its container intercepts clicks.
**Prevention**: Set `pointer-events: none` aggressively on the WebGL canvas wrapper. Let all events pass through to the DOM.

## 3. Multipass Feedback Loop Error
**Warning Sign**: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT" or WebGL crashing/turning black dynamically.
**Cause**: Reading and writing to the exact same Framebuffer texture simultaneously during the blur pass computations.
**Prevention**: Implement strict Ping-Pong processing (using two separate FBOs swapping roles as texture source and draw destination).
