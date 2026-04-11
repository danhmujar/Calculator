/**
 * services/theme.js
 * Bridge between JSON Theme Definitions, DOM CSS Variables, and WebGL uniforms.
 * Includes ThemeTransitionManager to smoothly interpolate theme changes.
 */

/**
 * Parses a hex color string (e.g., "#ffffff" or "#fff") into a normalized [r, g, b] array.
 * @param {string} hex - The hex color string.
 * @returns {number[]} Normalized RGB values [0.0, 1.0].
 */
function parseHexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return [0, 0, 0];
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
 * Parses a CSS color string (hex, rgb, or rgba) into an array for interpolation.
 * @param {string} colorStr 
 * @returns {number[]|null} [r, g, b, a] where RGB is 0-255 and A is 0-1, or null if unparseable
 */
function parseCssColor(colorStr) {
    if (!colorStr || typeof colorStr !== 'string') return null;
    colorStr = colorStr.trim();
    
    if (colorStr.startsWith('#')) {
        let hex = colorStr.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length === 6) {
            const num = parseInt(hex, 16);
            return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 1.0];
        }
        if (hex.length === 8) {
            const num = parseInt(hex, 16);
            return [(num >> 24) & 255, (num >> 16) & 255, (num >> 8) & 255, (num & 255) / 255];
        }
    } else if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
        const match = colorStr.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
        if (match) {
            return [
                parseFloat(match[1]),
                parseFloat(match[2]),
                parseFloat(match[3]),
                match[4] !== undefined ? parseFloat(match[4]) : 1.0
            ];
        }
    }
    return null;
}

/**
 * Manages theme color transitions to avoid layout thrashing and provide smooth visuals.
 * Offloads theme variables from CSS to JSON for better performance and maintainability.
 */
class ThemeTransitionManager {
    constructor() {
        this.duration = 400; // ms
        this.startTime = 0;
        this.isTransitioning = false;
        this.themes = null;
        
        this.currentColors = {
            uAuroraColor1: [0.1, 0.04, 0.18],
            uAuroraColor2: [0.29, 0.11, 0.32],
            uAuroraColor3: [0.05, 0.16, 0.28],
            uGrainIntensity: 0.0,
            uBackgroundMode: 0
        };
        
        this.startColors = { ...this.currentColors };
        this.targetColors = { ...this.currentColors };
    }

    /**
     * Loads theme data and initializes the manager.
     */
    async init() {
        try {
            const baseUrl = import.meta.env.BASE_URL || '/';
            const response = await fetch(`${baseUrl}services/themes.json?t=${Date.now()}`);
            this.themes = await response.json();
            
            const initial = this._fetchThemeColors();
            this.currentColors = { ...initial };
            this.startColors = { ...initial };
            this.targetColors = { ...initial };
            this._applyColorsToDOM(this.currentColors);
        } catch (error) {
            console.error('Failed to load themes.json:', error);
        }
    }

    /**
     * Helper to map theme class to background mode.
     */
    _getModeFromClass(className) {
        if (className.includes('theme-bts')) return 2;
        if (className.includes('theme-aurora')) return 1;
        return 0;
    }

    /**
     * Internal helper to fetch colors from the loaded JSON themes.
     */
    _fetchThemeColors() {
        if (!this.themes) return this.currentColors;

        const classList = document.body.className.split(' ');
        const isDark = classList.includes('dark-theme');
        let activeTheme = 'default';
        
        for (const cls of classList) {
            if (cls.startsWith('theme-')) {
                activeTheme = cls;
                break;
            }
        }
        
        // FOUNDATION: Always start with the 'default' (light) theme variables.
        // This ensures that every CSS variable we support has a target for interpolation.
        let themeData = { ...this.themes['default'] };
        
        // MODE OVERLAY: If in dark mode, overlay the base 'dark' variables.
        if (isDark) {
            themeData = { ...themeData, ...this.themes['dark'] };
        }
        
        // THEME OVERRIDE: Merge in the specific theme variables
        if (activeTheme !== 'default' && this.themes[activeTheme]) {
            let specificData = { ...this.themes[activeTheme] };
            
            // Handle dark variants: check for "theme-name-dark" key
            if (isDark) {
                const darkKey = `${activeTheme}-dark`;
                if (this.themes[darkKey]) {
                    specificData = { ...specificData, ...this.themes[darkKey] };
                }
            }
            
            // SPECIAL CASE: If the theme defines --bg-color but NOT --aurora-color-1,
            // we MUST override the base theme's --aurora-color-1 to match the tinted background.
            // This mirrors the CSS :root { --aurora-color-1: var(--bg-color); } fallback.
            if (specificData['--bg-color'] && !specificData['--aurora-color-1']) {
                specificData['--aurora-color-1'] = specificData['--bg-color'];
            }
            
            themeData = { ...themeData, ...specificData };
        }
        
        const mode = this._getModeFromClass(activeTheme);
        const grain = mode === 0 ? 0.02 : 0.0;

        const targetState = {
            uBackgroundMode: mode,
            uGrainIntensity: grain,
            uAuroraColor1: parseHexToRgb(themeData['--aurora-color-1'] || (isDark ? '#080c14' : '#f4f5f7')),
            uAuroraColor2: parseHexToRgb(themeData['--aurora-color-2'] || '#4b1d52'),
            uAuroraColor3: parseHexToRgb(themeData['--aurora-color-3'] || '#0d2847')
        };

        // Merge all variables from JSON into target state
        for (const [key, value] of Object.entries(themeData)) {
            if (key.startsWith('--')) {
                const parsedColor = parseCssColor(value);
                if (parsedColor !== null) {
                    targetState[key] = parsedColor; // [r, g, b, a]
                } else {
                    targetState[key] = value; // strings like box-shadow
                }
            }
        }

        return targetState;
    }

    /**
     * Updates the target theme by fetching from JSON.
     */
    updateTargetTheme() {
        if (!this.themes) return;
        this.startColors = { ...this.currentColors };
        this.targetColors = this._fetchThemeColors();
        this.startTime = performance.now();
        this.isTransitioning = true;

        // Immediate application for first frame (critical for tests and FOUC)
        this._applyColorsToDOM(this.targetColors);
    }

    /**
     * Interpolates colors and applies them to DOM and WebGL.
     */
    getInterpolatedTheme(now) {
        if (!this.isTransitioning) {
            return this.currentColors;
        }

        const elapsed = now - this.startTime;
        let t = Math.min(elapsed / this.duration, 1.0);
        const easedT = t * (2.0 - t);

        for (const key in this.targetColors) {
            const start = this.startColors[key];
            const target = this.targetColors[key];
            
            if (Array.isArray(target) && Array.isArray(start)) {
                const result = [];
                for(let i=0; i<target.length; i++){
                    result[i] = start[i] + (target[i] - start[i]) * easedT;
                }
                this.currentColors[key] = result;
            } else if (typeof target === 'number' && key !== 'uBackgroundMode') {
                this.currentColors[key] = start + (target - start) * easedT;
            } else {
                this.currentColors[key] = target;
            }
        }

        this._applyColorsToDOM(this.currentColors);

        if (t >= 1.0) {
            this.isTransitioning = false;
        }

        return this.currentColors;
    }

    /**
     * Applies the current interpolated state to the DOM as CSS variables.
     */
    _applyColorsToDOM(state) {
        const style = document.body.style;
        for (const [key, value] of Object.entries(state)) {
            if (key.startsWith('--')) {
                if (Array.isArray(value)) {
                    if (value.length === 4) {
                        // Standardize on 0-255 for RGB and 0-1 for A
                        style.setProperty(key, `rgba(${Math.round(value[0])}, ${Math.round(value[1])}, ${Math.round(value[2])}, ${value[3]})`);
                    } else {
                        style.setProperty(key, `rgb(${Math.round(value[0])}, ${Math.round(value[1])}, ${Math.round(value[2])})`);
                    }
                } else {
                    style.setProperty(key, value);
                }
            }
        }

        // Calculate dynamic alpha variants
        if (state['--primary-blue'] && Array.isArray(state['--primary-blue'])) {
            const [r, g, b] = state['--primary-blue'];
            const rInt = Math.round(r);
            const gInt = Math.round(g);
            const bInt = Math.round(b);
            style.setProperty('--primary-alpha-05', `rgba(${rInt}, ${gInt}, ${bInt}, 0.05)`);
            style.setProperty('--primary-alpha-10', `rgba(${rInt}, ${gInt}, ${bInt}, 0.10)`);
            style.setProperty('--primary-alpha-15', `rgba(${rInt}, ${gInt}, ${bInt}, 0.15)`);
            style.setProperty('--primary-alpha-30', `rgba(${rInt}, ${gInt}, ${bInt}, 0.30)`);
        }
    }
}

export const themeManager = new ThemeTransitionManager();

export function getThemeUniforms() {
    return themeManager.getInterpolatedTheme(performance.now());
}
