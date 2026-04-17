import { renderer } from './renderer.js';

const EYE_RADIUS_PUPIL_1 = 4;
const EYE_RADIUS_PUPIL_2 = 3.5;
const EYE_FOLLOW_SPEED = 0.15;
const SMOOTHING = 0.12; // EMA factor

/**
 * Initializes eye-tracking for the calculator character.
 * Uses an Exponential Moving Average (EMA) loop for smooth, organic inertia.
 */
export function initEyeTracking() {
  // State for EMA
  const state = {
    targetX1: 0,
    targetY1: 0,
    currentX1: 0,
    currentY1: 0,
    targetX2: 0,
    targetY2: 0,
    currentX2: 0,
    currentY2: 0,
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
  };

  const eyeContainers = document.querySelectorAll('.calculator-svg');

  // Update target coordinates on mouse move
  document.addEventListener('mousemove', (e) => {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
  });

  /**
   * Internal loop to apply EMA and update CSS variables.
   * Uses live getBoundingClientRect() to handle dual-monitor setups,
   * sidebar toggles, and scroll-induced position changes.
   */
  function update() {
    eyeContainers.forEach((svg) => {
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      // Calculate scale factor relative to viewBox width (70)
      const scale = rect.width / 70;

      // Calculate targets based on mouse position relative to eyes
      // SVG viewBox="15 5 70 90"
      const cx1 = rect.left + rect.width * (23 / 70);
      const cy1 = rect.top + rect.height * (22 / 90);

      const cx2 = rect.left + rect.width * (47 / 70);
      const cy2 = rect.top + rect.height * (22 / 90);

      const dx1 = state.mouseX - cx1;
      const dy1 = state.mouseY - cy1;
      const angle1 = Math.atan2(dy1, dx1);

      const dx2 = state.mouseX - cx2;
      const dy2 = state.mouseY - cy2;
      const angle2 = Math.atan2(dy2, dx2);

      // Calculate max displacement scaled to eye size
      const dist1 = Math.min(
        EYE_RADIUS_PUPIL_1 * scale,
        Math.hypot(dx1, dy1) * EYE_FOLLOW_SPEED
      );
      state.targetX1 = Math.cos(angle1) * dist1;
      state.targetY1 = Math.sin(angle1) * dist1;

      const dist2 = Math.min(
        EYE_RADIUS_PUPIL_2 * scale,
        Math.hypot(dx2, dy2) * EYE_FOLLOW_SPEED
      );
      state.targetX2 = Math.cos(angle2) * dist2;
      state.targetY2 = Math.sin(angle2) * dist2;

      // Apply EMA smoothing: current += (target - current) * factor
      state.currentX1 += (state.targetX1 - state.currentX1) * SMOOTHING;
      state.currentY1 += (state.targetY1 - state.currentY1) * SMOOTHING;
      state.currentX2 += (state.targetX2 - state.currentX2) * SMOOTHING;
      state.currentY2 += (state.targetY2 - state.currentY2) * SMOOTHING;

      // Update CSS variables
      const wrapper = svg.closest('.calculator-wrapper');
      if (wrapper) {
        // Use translate3d for hardware acceleration
        wrapper.style.setProperty(
          '--pupil-x-1',
          `${state.currentX1.toFixed(2)}px`
        );
        wrapper.style.setProperty(
          '--pupil-y-1',
          `${state.currentY1.toFixed(2)}px`
        );
        wrapper.style.setProperty(
          '--pupil-x-2',
          `${state.currentX2.toFixed(2)}px`
        );
        wrapper.style.setProperty(
          '--pupil-y-2',
          `${state.currentY2.toFixed(2)}px`
        );
      }
    });

    requestAnimationFrame(update);
  }

  // Start the loop
  requestAnimationFrame(update);
}
