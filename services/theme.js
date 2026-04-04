/**
 * services/theme.js
 * Bridge between CSS Custom Properties and WebGL uniforms.
 * Includes ThemeTransitionManager to smoothly interpolate theme changes.
 */

/**
 * Parses a hex color string (e.g., "#ffffff" or "#fff") into a normalized [r, g, b] array.
 * @param {string} hex - The hex color string.
 * @returns {number[]} Normalized RGB values [0.0, 1.0].
 */
function parseHexToRgb(hex) {
    hex = hex.trim().replace(/^#/, '');
    
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    return [
        isNaN(r) ? 0 : r,
        isNaN(g) ? 0 : g,
        isNaN(b) ? 0 : b
    ];
}

/**
 * Manages theme color transitions to avoid layout thrashing and provide smooth visuals.
 */
class ThemeTransitionManager {
    constructor() {
        this.duration = 400; // ms
        this.startTime = 0;
        this.isTransitioning = false;
        
        this.currentColors = {
            uAuroraColor1: [0.1, 0.04, 0.18],
            uAuroraColor2: [0.29, 0.11, 0.32],
            uAuroraColor3: [0.05, 0.16, 0.28]
        };
        
        this.startColors = { ...this.currentColors };
        this.targetColors = { ...this.currentColors };
    }

    /**
     * Initializes the manager with the current theme colors from the DOM.
     */
    init() {
        const initial = this._fetchThemeColors();
        this.currentColors = { ...initial };
        this.startColors = { ...initial };
        this.targetColors = { ...initial };
    }

    /**
     * Internal helper to fetch colors from CSS variables.
     * Only call this when the theme actually changes to avoid layout thrashing.
     */
    _fetchThemeColors() {
        const style = getComputedStyle(document.body);
        const color1 = style.getPropertyValue('--aurora-color-1').trim() || '#1a0b2e';
        const color2 = style.getPropertyValue('--aurora-color-2').trim() || '#4b1d52';
        const color3 = style.getPropertyValue('--aurora-color-3').trim() || '#0d2847';
        
        return {
            uAuroraColor1: parseHexToRgb(color1),
            uAuroraColor2: parseHexToRgb(color2),
            uAuroraColor3: parseHexToRgb(color3)
        };
    }

    /**
     * Updates the target theme by fetching current CSS variables.
     * Call this when the theme class on the body/html changes.
     */
    updateTargetTheme() {
        this.startColors = { ...this.currentColors };
        this.targetColors = this._fetchThemeColors();
        this.startTime = performance.now();
        this.isTransitioning = true;
    }

    /**
     * Interpolates between start and target colors based on the current time.
     * Uses Quadratic Out easing: t * (2.0 - t)
     * @param {number} now - The current performance.now() timestamp.
     * @returns {Object} The currently interpolated colors.
     */
    getInterpolatedTheme(now) {
        if (!this.isTransitioning) {
            return this.currentColors;
        }

        const elapsed = now - this.startTime;
        let t = Math.min(elapsed / this.duration, 1.0);
        
        // Quadratic Out easing: t * (2.0 - t)
        const easedT = t * (2.0 - t);

        for (const key in this.targetColors) {
            const start = this.startColors[key];
            const target = this.targetColors[key];
            
            this.currentColors[key] = [
                start[0] + (target[0] - start[0]) * easedT,
                start[1] + (target[1] - start[1]) * easedT,
                start[2] + (target[2] - start[2]) * easedT
            ];
        }

        if (t >= 1.0) {
            this.isTransitioning = false;
        }

        return this.currentColors;
    }
}

// Export a singleton instance
export const themeManager = new ThemeTransitionManager();

/**
 * Legacy support for direct uniform fetching (Deprecated: use themeManager instead)
 */
export function getThemeUniforms() {
    return themeManager.getInterpolatedTheme(performance.now());
}
