/**
 * services/theme.js
 * Bridge between CSS Custom Properties and WebGL uniforms.
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
 * Reads the current theme's Aurora color variables from the DOM.
 * @returns {Object} An object containing the parsed theme uniforms.
 */
export function getThemeUniforms() {
    const style = getComputedStyle(document.documentElement);
    
    // Default fallback colors if variables are missing
    const color1 = style.getPropertyValue('--aurora-color-1') || '#1a0b2e';
    const color2 = style.getPropertyValue('--aurora-color-2') || '#4b1d52';
    const color3 = style.getPropertyValue('--aurora-color-3') || '#0d2847';
    
    return {
        uAuroraColor1: parseHexToRgb(color1),
        uAuroraColor2: parseHexToRgb(color2),
        uAuroraColor3: parseHexToRgb(color3)
    };
}
