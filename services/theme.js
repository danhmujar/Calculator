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
    } else if (colorStr.startsWith('rgb')) {
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

// --- Theme Configuration (Single Source of Truth) ---

const BASE_LIGHT = {
    '--bg-color': '#f4f5f7',
    '--panel-bg': '#ffffff',
    '--border-color': '#e1e4e8',
    '--text-primary': '#172b4d',
    '--text-secondary': '#374151',
    '--primary-blue': '#0052cc',
    '--primary-hover': '#003d99',
    '--calc-btn-bg': '#fafbfc',
    '--calc-btn-border': '#dfe1e6',
    '--calc-btn-hover': '#ebecf0',
    '--aurora-color-1': '#f4f5f7',
    // Neumorphism
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
    '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '--panel-shadow': '-4px 0 15px rgba(0, 0, 0, 0.03)',
    // Semantic Colors
    '--danger': '#de350b',
    '--danger-hover': '#bf2600',
    '--danger-bg': '#ffebe6',
    '--warning': '#f59e0b',
    // Glass
    '--glass-border': 'rgba(255, 255, 255, 0.35)',
    '--glass-bg': 'rgba(255, 255, 255, 0.82)',
    '--glass-bg-hover': 'rgba(255, 255, 255, 0.70)',
    '--modal-glass-bg': 'rgba(255, 255, 255, 0.45)',
    '--modal-glass-border': 'rgba(255, 255, 255, 0.45)',
    '--overlay-backdrop': 'rgba(255, 255, 255, 0.5)',
    '--glass-shadow': '0 4px 16px rgba(0, 0, 0, 0.10), 0 1px 3px rgba(0, 0, 0, 0.06)',
    '--glass-shadow-hover': '0 8px 24px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.08)',
    '--close-btn-bg': 'rgba(0, 0, 0, 0.06)',
    '--close-btn-bg-hover': 'rgba(0, 0, 0, 0.12)',
    '--shadow-soft-light': 'rgba(255, 255, 255, 0.9)',
    '--shadow-soft-dark': 'rgba(0, 0, 0, 0.08)'
};

const BASE_DARK = {
    '--bg-color': '#080c14',
    '--panel-bg': '#151b26',
    '--border-color': '#212a3d',
    '--text-primary': '#e6e8ed',
    '--text-secondary': '#9aa1b3',
    '--primary-blue': '#0052cc', // Fallback, usually overridden
    '--primary-hover': '#003d99',
    '--calc-btn-bg': '#1a2233',
    '--calc-btn-border': '#212a3d',
    '--calc-btn-hover': '#243044',
    '--aurora-color-1': '#080c14',
    // Neumorphism Dark
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
    '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    '--panel-shadow': '-4px 0 25px rgba(0, 0, 0, 0.5)',
    // Semantic Dark
    '--danger': '#ff6b4a',
    '--danger-hover': '#ff5232',
    '--danger-bg': 'rgba(222, 53, 11, 0.15)',
    '--warning': '#fbbf24',
    // Glass Dark
    '--glass-border': 'rgba(255, 255, 255, 0.12)',
    '--glass-bg': 'rgba(30, 32, 40, 0.82)',
    '--glass-bg-hover': 'rgba(40, 42, 52, 0.80)',
    '--modal-glass-bg': 'rgba(28, 30, 36, 0.45)',
    '--modal-glass-border': 'rgba(255, 255, 255, 0.08)',
    '--overlay-backdrop': 'rgba(255, 255, 255, 0.15)',
    '--glass-shadow': '0 4px 16px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
    '--glass-shadow-hover': '0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)',
    '--close-btn-bg': 'rgba(255, 255, 255, 0.08)',
    '--close-btn-bg-hover': 'rgba(255, 255, 255, 0.16)',
    '--shadow-soft-light': 'rgba(255, 255, 255, 0.05)',
    '--shadow-soft-dark': 'rgba(0, 0, 0, 0.4)'
};

const BASE_WEBGL_THEME = {
    '--text-primary': '#ffffff',
    '--text-secondary': '#a7a2bd',
    '--shadow-soft-light': 'rgba(255, 255, 255, 0.05)',
    '--shadow-soft-dark': 'rgba(0, 0, 0, 0.5)',
    '--panel-shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
    '--glass-border': 'rgba(255, 255, 255, 0.15)',
    '--glass-bg': 'rgba(20, 15, 30, 0.75)',
    '--glass-bg-hover': 'rgba(30, 20, 40, 0.70)',
    '--modal-glass-bg': 'rgba(20, 15, 30, 0.55)',
    '--modal-glass-border': 'rgba(255, 255, 255, 0.12)',
    '--overlay-backdrop': 'rgba(10, 5, 20, 0.6)',
    '--close-btn-bg': 'rgba(255, 255, 255, 0.08)',
    '--close-btn-bg-hover': 'rgba(255, 255, 255, 0.16)'
};

const THEME_CONFIG = {
    '': { // Default (Financial Blue)
        light: { ...BASE_LIGHT },
        dark: { ...BASE_DARK }
    },
    'theme-teal': {
        light: {
            ...BASE_LIGHT,
            '--bg-color': '#E6F2F2',
            '--aurora-color-1': '#E6F2F2',
            '--panel-bg': '#F4F9F9',
            '--border-color': '#B2D8D8',
            '--primary-blue': '#0A7A7A',
            '--primary-hover': '#075E5E'
        },
        dark: {
            ...BASE_DARK,
            '--bg-color': '#041616',
            '--aurora-color-1': '#041616',
            '--panel-bg': '#072626',
            '--border-color': '#0E3E3E',
            '--primary-blue': '#23A9A9',
            '--primary-hover': '#1A8080',
            '--calc-btn-bg': '#0A3030',
            '--calc-btn-hover': '#0D3E3E',
            '--calc-btn-border': '#134C4C'
        }
    },
    'theme-terracotta': {
        light: {
            ...BASE_LIGHT,
            '--bg-color': '#F8EBE7',
            '--aurora-color-1': '#F8EBE7',
            '--panel-bg': '#FDF9F8',
            '--border-color': '#E2BDB2',
            '--primary-blue': '#C15C3D',
            '--primary-hover': '#9E492F'
        },
        dark: {
            ...BASE_DARK,
            '--bg-color': '#1A0D0A',
            '--aurora-color-1': '#1A0D0A',
            '--panel-bg': '#2B1813',
            '--border-color': '#4A2B23',
            '--primary-blue': '#E27B5A',
            '--primary-hover': '#CF6848',
            '--calc-btn-bg': '#351F18',
            '--calc-btn-hover': '#40261E',
            '--calc-btn-border': '#52352B'
        }
    },
    'theme-forest': {
        light: {
            ...BASE_LIGHT,
            '--bg-color': '#EBF1ED',
            '--aurora-color-1': '#EBF1ED',
            '--panel-bg': '#F5F8F6',
            '--border-color': '#B5CDBE',
            '--primary-blue': '#3E7153',
            '--primary-hover': '#2D563D'
        },
        dark: {
            ...BASE_DARK,
            '--bg-color': '#09120D',
            '--aurora-color-1': '#09120D',
            '--panel-bg': '#111F17',
            '--border-color': '#1D3627',
            '--primary-blue': '#61A37B',
            '--primary-hover': '#4F8A66',
            '--calc-btn-bg': '#15271D',
            '--calc-btn-hover': '#1A3125',
            '--calc-btn-border': '#234031'
        }
    },
    'theme-slate': {
        light: {
            ...BASE_LIGHT,
            '--bg-color': '#EDEFF2',
            '--aurora-color-1': '#EDEFF2',
            '--panel-bg': '#F5F7F9',
            '--border-color': '#CBD2DE',
            '--primary-blue': '#475569',
            '--primary-hover': '#334155'
        },
        dark: {
            ...BASE_DARK,
            '--bg-color': '#0A0D11',
            '--aurora-color-1': '#0A0D11',
            '--panel-bg': '#121820',
            '--border-color': '#212C3B',
            '--primary-blue': '#7E95AD',
            '--primary-hover': '#677A8F',
            '--calc-btn-bg': '#171E28',
            '--calc-btn-hover': '#1D2633',
            '--calc-btn-border': '#273344'
        }
    },
    'theme-rosewood': {
        light: {
            ...BASE_LIGHT,
            '--bg-color': '#F8ECEE',
            '--aurora-color-1': '#F8ECEE',
            '--panel-bg': '#FDF9FA',
            '--border-color': '#DEC3C8',
            '--primary-blue': '#B86B77',
            '--primary-hover': '#9B5561'
        },
        dark: {
            ...BASE_DARK,
            '--bg-color': '#1A0C0E',
            '--aurora-color-1': '#1A0C0E',
            '--panel-bg': '#291619',
            '--border-color': '#46292E',
            '--primary-blue': '#D58693',
            '--primary-hover': '#C3707D',
            '--calc-btn-bg': '#341E22',
            '--calc-btn-hover': '#40252A',
            '--calc-btn-border': '#503137'
        }
    },
    'theme-pistachio': {
        light: {
            ...BASE_LIGHT,
            '--bg-color': '#F1F6F2',
            '--aurora-color-1': '#F1F6F2',
            '--panel-bg': '#F8FBF8',
            '--border-color': '#C0D8C4',
            '--primary-blue': '#6A9970',
            '--primary-hover': '#537C58'
        },
        dark: {
            ...BASE_DARK,
            '--bg-color': '#0A140C',
            '--aurora-color-1': '#0A140C',
            '--panel-bg': '#112014',
            '--border-color': '#1F3A24',
            '--primary-blue': '#8CBA92',
            '--primary-hover': '#75A37B',
            '--calc-btn-bg': '#162919',
            '--calc-btn-hover': '#1C3320',
            '--calc-btn-border': '#25422A'
        }
    },
    'theme-purple': {
        light: {
            ...BASE_LIGHT,
            '--bg-color': '#F1EDFC',
            '--aurora-color-1': '#F1EDFC',
            '--panel-bg': '#F8F6FD',
            '--border-color': '#CDBCF4',
            '--primary-blue': '#7C3AED',
            '--primary-hover': '#6D28D9'
        },
        dark: {
            ...BASE_DARK,
            '--bg-color': '#120A24',
            '--aurora-color-1': '#120A24',
            '--panel-bg': '#1B113B',
            '--border-color': '#332168',
            '--primary-blue': '#A276F5',
            '--primary-hover': '#915CF2',
            '--calc-btn-bg': '#23164D',
            '--calc-btn-hover': '#291C5C',
            '--calc-btn-border': '#3A287B'
        }
    },
    'theme-aurora': {
        light: {
            ...BASE_LIGHT,
            ...BASE_WEBGL_THEME,
            '--bg-color': '#0d0614',
            '--panel-bg': 'rgba(20, 15, 30, 0.5)',
            '--border-color': 'rgba(255, 255, 255, 0.15)',
            '--primary-blue': '#d946ef',
            '--primary-hover': '#c026d3',
            '--calc-btn-bg': 'rgba(26, 18, 40, 0.5)',
            '--calc-btn-border': 'rgba(45, 30, 70, 0.4)',
            '--calc-btn-hover': 'rgba(50, 30, 80, 0.6)',
            '--aurora-color-1': '#1a0b2e',
            '--aurora-color-2': '#4b1d52',
            '--aurora-color-3': '#0d2847'
        },
        dark: {} // Re-mapped below
    },
    'theme-aurora-ocean': {
        light: {
            ...BASE_LIGHT,
            ...BASE_WEBGL_THEME,
            '--bg-color': '#040f1a',
            '--panel-bg': 'rgba(10, 25, 40, 0.5)',
            '--border-color': 'rgba(255, 255, 255, 0.12)',
            '--primary-blue': '#0ea5e9',
            '--primary-hover': '#0284c7',
            '--calc-btn-bg': 'rgba(12, 30, 50, 0.5)',
            '--calc-btn-border': 'rgba(20, 50, 80, 0.4)',
            '--calc-btn-hover': 'rgba(25, 60, 95, 0.6)',
            '--aurora-color-1': '#040f1a',
            '--aurora-color-2': '#0c3a5e',
            '--aurora-color-3': '#2b1d4d'
        },
        dark: {}
    },
    'theme-aurora-cyber': {
        light: {
            ...BASE_LIGHT,
            ...BASE_WEBGL_THEME,
            '--bg-color': '#050f0c',
            '--panel-bg': 'rgba(10, 25, 20, 0.5)',
            '--border-color': 'rgba(255, 255, 255, 0.12)',
            '--primary-blue': '#10b981',
            '--primary-hover': '#059669',
            '--calc-btn-bg': 'rgba(12, 35, 25, 0.5)',
            '--calc-btn-border': 'rgba(20, 60, 40, 0.4)',
            '--calc-btn-hover': 'rgba(25, 75, 50, 0.6)',
            '--aurora-color-1': '#051f15',
            '--aurora-color-2': '#0f4a2d',
            '--aurora-color-3': '#0a424f'
        },
        dark: {}
    },
    'theme-aurora-sunset': {
        light: {
            ...BASE_LIGHT,
            ...BASE_WEBGL_THEME,
            '--bg-color': '#1a0808',
            '--panel-bg': 'rgba(40, 15, 15, 0.5)',
            '--border-color': 'rgba(255, 255, 255, 0.12)',
            '--primary-blue': '#fb923c',
            '--primary-hover': '#ea580c',
            '--calc-btn-bg': 'rgba(50, 20, 20, 0.5)',
            '--calc-btn-border': 'rgba(80, 30, 30, 0.4)',
            '--calc-btn-hover': 'rgba(95, 40, 40, 0.6)',
            '--aurora-color-1': '#2a0b0b',
            '--aurora-color-2': '#7c2d12',
            '--aurora-color-3': '#831843'
        },
        dark: {}
    },
    'theme-bts': {
        light: {
            ...BASE_LIGHT,
            ...BASE_WEBGL_THEME,
            '--bg-color': '#0d0618',
            '--panel-bg': 'rgba(20, 10, 35, 0.55)',
            '--border-color': 'rgba(180, 130, 255, 0.18)',
            '--text-primary': '#f0e6ff',
            '--text-secondary': '#b8a4d6',
            '--primary-blue': '#9b59b6',
            '--primary-hover': '#8344a5',
            '--calc-btn-bg': 'rgba(30, 15, 50, 0.55)',
            '--calc-btn-border': 'rgba(60, 30, 100, 0.4)',
            '--calc-btn-hover': 'rgba(70, 35, 115, 0.6)',
            '--aurora-color-1': '#1a0633',
            '--aurora-color-2': '#5b2d8e',
            '--aurora-color-3': '#2e1065',
            '--glass-border': 'rgba(180, 130, 255, 0.15)',
            '--glass-bg': 'rgba(20, 10, 35, 0.75)',
            '--glass-bg-hover': 'rgba(30, 15, 50, 0.70)',
            '--modal-glass-bg': 'rgba(20, 10, 35, 0.55)',
            '--modal-glass-border': 'rgba(180, 130, 255, 0.12)',
            '--overlay-backdrop': 'rgba(10, 5, 20, 0.6)',
            '--close-btn-bg': 'rgba(255, 255, 255, 0.08)',
            '--close-btn-bg-hover': 'rgba(255, 255, 255, 0.16)'
        },
        dark: {}
    }
};

// Map identical dark modes for Aurora/BTS
THEME_CONFIG['theme-aurora'].dark = THEME_CONFIG['theme-aurora'].light;
THEME_CONFIG['theme-aurora-ocean'].dark = THEME_CONFIG['theme-aurora-ocean'].light;
THEME_CONFIG['theme-aurora-cyber'].dark = THEME_CONFIG['theme-aurora-cyber'].light;
THEME_CONFIG['theme-aurora-sunset'].dark = THEME_CONFIG['theme-aurora-sunset'].light;
THEME_CONFIG['theme-bts'].dark = THEME_CONFIG['theme-bts'].light;

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
            uAuroraColor3: [0.05, 0.16, 0.28],
            uGrainIntensity: 0.0,
            uBackgroundMode: 0
        };
        
        this.startColors = { ...this.currentColors };
        this.targetColors = { ...this.currentColors };
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
     * Initializes the manager with the current theme colors from the JS config.
     */
    init() {
        const initial = this._fetchThemeColors();
        this.currentColors = { ...initial };
        this.startColors = { ...initial };
        this.targetColors = { ...initial };
        this._applyColorsToDOM(this.currentColors);
    }

    /**
     * Internal helper to fetch colors from the JS configuration.
     */
    _fetchThemeColors() {
        const classList = document.body.className.split(' ');
        const isDark = classList.includes('dark-theme');
        let activeTheme = '';
        
        for (const cls of classList) {
            if (cls.startsWith('theme-')) {
                activeTheme = cls;
                break;
            }
        }
        
        const themeData = THEME_CONFIG[activeTheme] || THEME_CONFIG[''];
        const palette = isDark ? themeData.dark : themeData.light;
        
        const mode = this._getModeFromClass(activeTheme);
        const grain = mode === 0 ? 0.02 : 0.0;

        const targetState = {
            uBackgroundMode: mode,
            uGrainIntensity: grain,
            uAuroraColor1: parseHexToRgb(palette['--aurora-color-1'] || '#1a0b2e'),
            uAuroraColor2: parseHexToRgb(palette['--aurora-color-2'] || '#4b1d52'),
            uAuroraColor3: parseHexToRgb(palette['--aurora-color-3'] || '#0d2847')
        };

        // Parse all CSS variables into the target state
        for (const [key, value] of Object.entries(palette)) {
            if (key.startsWith('--') && !key.startsWith('--aurora-color')) {
                if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb'))) {
                    const parsedColor = parseCssColor(value);
                    if (parsedColor !== null) {
                        targetState[key] = parsedColor; // Array of [r, g, b, a]
                    } else {
                        targetState[key] = value;
                    }
                } else {
                    targetState[key] = value; // Keep as string (e.g., box-shadow)
                }
            }
        }

        return targetState;
    }

    /**
     * Updates the target theme by fetching from JS Config.
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
            
            if (Array.isArray(target) && Array.isArray(start)) {
                // Determine length based on target to support both rgb and rgba
                const result = [];
                for(let i=0; i<target.length; i++){
                    // For WebGL uniforms (length 3), we interpolate float 0-1
                    // For DOM variables (length 4), we interpolate 0-255 and alpha 0-1
                    result[i] = start[i] + (target[i] - start[i]) * easedT;
                }
                this.currentColors[key] = result;
            } else if (typeof target === 'number' && key !== 'uBackgroundMode') {
                this.currentColors[key] = start + (target - start) * easedT;
            } else {
                // Non-interpolated values (strings, booleans, uBackgroundMode)
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
     * Applies the current interpolated color state to the DOM as CSS variables.
     * @param {Object} state 
     */
    _applyColorsToDOM(state) {
        for (const [key, value] of Object.entries(state)) {
            if (key.startsWith('--')) {
                if (Array.isArray(value)) {
                    if (value.length === 4) {
                        document.body.style.setProperty(key, `rgba(${Math.round(value[0])}, ${Math.round(value[1])}, ${Math.round(value[2])}, ${value[3].toFixed(3)})`);
                    } else {
                        document.body.style.setProperty(key, `rgb(${Math.round(value[0])}, ${Math.round(value[1])}, ${Math.round(value[2])})`);
                    }
                } else {
                    document.body.style.setProperty(key, value);
                }
            }
        }

        // Dynamically calculate alpha variants for the primary blue color
        if (state['--primary-blue'] && Array.isArray(state['--primary-blue'])) {
            const [r, g, b] = state['--primary-blue'];
            const rInt = Math.round(r);
            const gInt = Math.round(g);
            const bInt = Math.round(b);
            document.body.style.setProperty('--primary-alpha-05', `rgba(${rInt}, ${gInt}, ${bInt}, 0.05)`);
            document.body.style.setProperty('--primary-alpha-10', `rgba(${rInt}, ${gInt}, ${bInt}, 0.10)`);
            document.body.style.setProperty('--primary-alpha-15', `rgba(${rInt}, ${gInt}, ${bInt}, 0.15)`);
            document.body.style.setProperty('--primary-alpha-30', `rgba(${rInt}, ${gInt}, ${bInt}, 0.30)`);
        }
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
