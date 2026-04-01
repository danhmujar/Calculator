import { ShaderManager, PRIMITIVE_VERT, PRIMITIVE_FRAG } from './shaders.js';
import { BufferManager } from './buffers.js';

/**
 * WebGLRenderer - Main rendering engine for high-performance UI primitives.
 * Implements the Underlay Pattern to provide GPU-accelerated backgrounds 
 * for DOM-based components.
 */
export class WebGLRenderer {
    /**
     * @param {WebGLContext} webglContext - The context manager instance
     */
    constructor(webglContext) {
        if (!webglContext || !webglContext.gl) {
            console.error('WebGLRenderer: A valid WebGLContext is required.');
            return;
        }

        this.context = webglContext;
        this.gl = webglContext.gl;
        this.program = null;
        this.unitQuad = null;
        this.initialized = false;
        
        /**
         * Cached theme colors from UIManager.
         */
        this.themeColors = {
            primary: [0.0, 0.32, 0.8, 1.0],
            accent: [0.96, 0.62, 0.04, 1.0],
            background: [0.96, 0.96, 0.97, 1.0]
        };

        /**
         * Unit quad data for SDF primitive rendering.
         * Format: [x, y, u, v] - Interleaved for cache efficiency.
         */
        this.quadData = [
            0, 0, 0, 0, // Bottom-left
            1, 0, 1, 0, // Bottom-right
            0, 1, 0, 1, // Top-left
            1, 1, 1, 1  // Top-right
        ];

        this.init();
    }

    /**
     * Bootstraps the WebGL pipeline (Shaders, Programs, VAOs).
     */
    init() {
        try {
            this.program = ShaderManager.createProgram(this.gl, PRIMITIVE_VERT, PRIMITIVE_FRAG);
            this.unitQuad = BufferManager.createVAO(this.gl, this.quadData, this.gl.STATIC_DRAW);
            this.initialized = true;
            console.info('WebGLRenderer: Primitive rendering pipeline initialized.');
        } catch (error) {
            console.error('WebGLRenderer: Pipeline initialization failed:', error);
            this.initialized = false;
        }
    }

    /**
     * Entry point for rendering a rounded rectangle primitive.
     * Uses the SDF shader to achieve high-precision anti-aliased edges.
     * 
     * @param {Object} rect - Dimensions {x, y, width, height} in CSS pixels
     * @param {number[]} color - RGBA normalized color [0.0, 1.0]
     * @param {number} radius - Corner radius in CSS pixels
     */
    drawPrimitive(rect, color, radius) {
        if (!this.initialized) return;

        const gl = this.gl;
        const dpr = window.devicePixelRatio || 1;

        gl.useProgram(this.program);

        // Map pixel-space coordinates to GL Clip-Space
        ShaderManager.setUniforms(gl, this.program, {
            u_resolution: [gl.canvas.width, gl.canvas.height],
            u_rectSize: [rect.width * dpr, rect.height * dpr],
            u_offset: [rect.x * dpr, rect.y * dpr],
            u_radius: radius * dpr,
            u_color: color
        });

        // Use the pre-configured VAO for standard unit quad geometry
        gl.bindVertexArray(this.unitQuad.vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.unitQuad.count);
        gl.bindVertexArray(null);
    }

    /**
     * Main rendering loop integration. 
     * Handles clearing the canvas and preparing for new draw calls.
     */
    render() {
        if (!this.initialized) return;

        /**
         * Underlay Pattern requires clearing to transparent 
         * so CSS backgrounds can show through if no primitives are drawn.
         */
        this.context.clear([0, 0, 0, 0]);

        // Verification: Draw a subtle highlight under the main display 
        // to confirm WebGL-to-DOM theme synchronization.
        const displayEl = document.getElementById('main-calc-display');
        if (displayEl) {
            const rect = displayEl.getBoundingClientRect();
            
            // Draw a primary-colored glow behind the display
            this.drawPrimitive({
                x: rect.left - 8,
                y: rect.top - 8,
                width: rect.width + 16,
                height: rect.height + 16
            }, [
                this.themeColors.primary[0],
                this.themeColors.primary[1],
                this.themeColors.primary[2],
                0.15 // Subtle alpha for the underlay
            ], 16);
        }
    }
}
