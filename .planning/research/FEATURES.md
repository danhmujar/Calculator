# Project Research: Features and Requirements

## Table Stakes (Must-Haves)

- **High-Performance Blur & Composition**: A multipass blur (typically 5-tap to 9-tap Gaussian ping-pong filter) to replicate heavy frosted glass realistically.
- **Dynamic Resizing**: Seamless adaptation to mobile portrait, tablet, and desktop aspect ratios.
- **High DPI Support**: Correct mapping of `window.devicePixelRatio` so WebGL textures do not look grainy or jagged on Retina/4K displays.
- **Battery Efficiency**: Pause rendering when there is no animation or user interaction. Calculating Aurora gradients continuously at 60fps drains laptop/mobile batteries fast.

## Differentiators

- **Synchronized Theming**: Native integration with the existing 12 themes where DOM CSS variables dynamically map to WebGL Shader `uniforms` instantly on swap.
- **Responsive Interactions**: Ripple effects or subtle light tracking following the mouse cursor or touch interactions.

## Anti-Features (Do Not Build)

- **3D DOM Projection**: Do not attempt to map DOM nodes onto 3D WebGL quads (like CSS3DRenderer). Keep the DOM native and 2D.
