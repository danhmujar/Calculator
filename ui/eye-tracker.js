import { renderer } from './renderer.js';

const EYE_RADIUS_PUPIL_1 = 4;
const EYE_RADIUS_PUPIL_2 = 3.5;
const EYE_FOLLOW_SPEED = 0.15;

/**
 * Initializes eye-tracking for the chameleon character.
 * Offloads animation to CSS variables and GPU-accelerated transforms.
 */
export function initEyeTracking() {
    let rafPending = false;
    const boundsCache = new Map();

    const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
            boundsCache.set(entry.target, entry.target.getBoundingClientRect());
        }
    });

    const eyeContainers = document.querySelectorAll('.calculator-wrapper svg');
    eyeContainers.forEach(svg => {
        observer.observe(svg);
        boundsCache.set(svg, svg.getBoundingClientRect());
    });

    document.addEventListener('mousemove', (e) => {
        if (rafPending) return;
        rafPending = true;

        renderer.schedule(() => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            eyeContainers.forEach((svg) => {
                const rect = boundsCache.get(svg);
                if (!rect) return;
                
                // SVG viewBox="15 5 70 90"
                // Left pupil: cx="38", cy="27" -> (38-15)/70 for X, (27-5)/90 for Y
                // Right pupil: cx="62", cy="27" -> (62-15)/70 for X, (27-5)/90 for Y
                const cx1 = rect.left + rect.width * (23 / 70);
                const cy1 = rect.top + rect.height * (22 / 90);
                
                const cx2 = rect.left + rect.width * (47 / 70);
                const cy2 = rect.top + rect.height * (22 / 90);

                const dx1 = mouseX - cx1;
                const dy1 = mouseY - cy1;
                const angle1 = Math.atan2(dy1, dx1);

                const dx2 = mouseX - cx2;
                const dy2 = mouseY - cy2;
                const angle2 = Math.atan2(dy2, dx2);

                // Pupil 1 (Left)
                const dist1 = Math.min(EYE_RADIUS_PUPIL_1, Math.hypot(dx1, dy1) * EYE_FOLLOW_SPEED);
                const tx1 = Math.cos(angle1) * dist1;
                const ty1 = Math.sin(angle1) * dist1;

                // Pupil 2 (Right)
                const dist2 = Math.min(EYE_RADIUS_PUPIL_2, Math.hypot(dx2, dy2) * EYE_FOLLOW_SPEED);
                const tx2 = Math.cos(angle2) * dist2;
                const ty2 = Math.sin(angle2) * dist2;

                const wrapper = svg.closest('.calculator-wrapper');
                if (wrapper) {
                    wrapper.style.setProperty('--pupil-x-1', `${tx1}px`);
                    wrapper.style.setProperty('--pupil-y-1', `${ty1}px`);
                    wrapper.style.setProperty('--pupil-x-2', `${tx2}px`);
                    wrapper.style.setProperty('--pupil-y-2', `${ty2}px`);
                }
            });

            rafPending = false;
        });
    });
}
