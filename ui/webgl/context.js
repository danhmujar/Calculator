/**
 * WebGLContext - Manages the Raw WebGL 2.0 rendering layer.
 * Implements the Underlay Pattern (z-index: -1).
 */
export class WebGLContext {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'webgl-underlay';
        
        // Attributes optimized for 2D UI underlay rendering
        const attributes = {
            alpha: false,
            antialias: true,
            depth: false,
            stencil: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false
        };

        this.gl = this.canvas.getContext('webgl2', attributes);

        if (!this.gl) {
            console.error('WebGL 2.0 not supported. Falling back to CSS-only background.');
            return;
        }

        this.setupStyles();
        this.setupEventListeners();
        this.resize();
    }

    /**
     * Applies required CSS for the Underlay Pattern.
     */
    setupStyles() {
        Object.assign(this.canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            zIndex: '-1',
            pointerEvents: 'none',
            display: 'block'
        });
    }

    /**
     * Binds lifecycle events for context loss/restoration.
     */
    setupEventListeners() {
        this.canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('WebGL context lost.');
        }, false);

        this.canvas.addEventListener('webglcontextrestored', () => {
            console.info('WebGL context restored.');
            this.resize();
        }, false);
    }

    /**
     * Resizes the canvas to match the viewport, accounting for device pixel ratio.
     */
    resize() {
        if (!this.gl) return;

        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;

        const displayWidth = Math.floor(width * dpr);
        const displayHeight = Math.floor(height * dpr);

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
        }

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Clears the buffer with a specific color.
     * @param {number[]} color - [r, g, b, a] normalized 0.0-1.0
     */
    clear(color = [0, 0, 0, 1]) {
        if (!this.gl) return;
        const [r, g, b, a] = color;
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
}
