import { ShaderManager, PRIMITIVE_VERT, PRIMITIVE_FRAG, BATCH_VERT, BATCH_FRAG } from './shaders.js';
import { BufferManager } from './buffers.js';
import { TextureAtlas } from './atlas.js';

/**
 * WebGLRenderer - Main rendering engine for high-performance UI primitives.
 * Implements an instanced Batch Renderer to provide GPU-accelerated 
 * backgrounds and text for DOM-based components in a single draw call.
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
        
        // Pipeline state
        this.program = null;
        this.unitQuad = null;
        this.batchProgram = null;
        this.batchVAO = null;
        this.atlas = null;
        
        // Batch configuration
        this.maxInstances = 2048;
        this.instanceData = new Float32Array(this.maxInstances * 14);
        this.instanceCount = 0;
        
        this.initialized = false;
        
        /**
         * Cached theme colors from UIManager.
         */
        this.themeColors = {
            primary: [0.0, 0.32, 0.8, 1.0],
            accent: [0.96, 0.62, 0.04, 1.0],
            background: [0.96, 0.96, 0.97, 1.0],
            text: [0.12, 0.12, 0.13, 1.0]
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

        // Register for context restoration
        this.context.onRestored = () => {
            console.info('WebGLRenderer: Context restored, re-initializing pipeline...');
            this.init();
            this.render();
        };

        this.init();
    }

    /**
     * Bootstraps the WebGL pipeline (Shaders, Programs, VAOs).
     */
    init() {
        try {
            const gl = this.gl;
            
            // Legacy single-rect pipeline (kept for compatibility)
            this.program = ShaderManager.createProgram(gl, PRIMITIVE_VERT, PRIMITIVE_FRAG);
            this.unitQuad = BufferManager.createVAO(gl, this.quadData, gl.STATIC_DRAW);
            
            // New Batch pipeline
            this.batchProgram = ShaderManager.createProgram(gl, BATCH_VERT, BATCH_FRAG);
            this.batchVAO = BufferManager.createInstancedVAO(gl, this.quadData, this.maxInstances);
            this.atlas = new TextureAtlas(gl);
            
            // Enable alpha blending for the underlay pattern
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            this.initialized = true;
            console.info('WebGLRenderer: Batch rendering pipeline initialized.');
        } catch (error) {
            console.error('WebGLRenderer: Pipeline initialization failed:', error);
            this.initialized = false;
        }
    }

    /**
     * Queues a rounded rectangle for the next batch flush.
     * 
     * @param {Object} rect - Dimensions {x, y, width, height} in CSS pixels
     * @param {number[]} color - RGBA normalized color [0.0, 1.0]
     * @param {number} radius - Corner radius in CSS pixels
     */
    pushRect(rect, color, radius) {
        if (!this.initialized) return;
        if (this.instanceCount >= this.maxInstances) this.flush();

        const offset = this.instanceCount * 14;
        const dpr = window.devicePixelRatio || 1;

        // Attribute layout: [pos.x, pos.y, size.w, size.h, uv.u, uv.v, uv.tw, uv.th, col.r, col.g, col.b, col.a, type, radius]
        this.instanceData[offset + 0] = rect.x * dpr;
        this.instanceData[offset + 1] = rect.y * dpr;
        this.instanceData[offset + 2] = rect.width * dpr;
        this.instanceData[offset + 3] = rect.height * dpr;
        
        // UVs are ignored for rects
        this.instanceData[offset + 4] = 0;
        this.instanceData[offset + 5] = 0;
        this.instanceData[offset + 6] = 1;
        this.instanceData[offset + 7] = 1;

        // Color
        this.instanceData[offset + 8] = color[0];
        this.instanceData[offset + 9] = color[1];
        this.instanceData[offset + 10] = color[2];
        this.instanceData[offset + 11] = color[3];

        // Metadata
        this.instanceData[offset + 12] = 0.0; // Type: 0 = Rect
        this.instanceData[offset + 13] = radius * dpr;

        this.instanceCount++;
    }

    /**
     * Queues an SDF text glyph for the next batch flush.
     * 
     * @param {string} char - The character to render
     * @param {string} font - CSS font string
     * @param {number} x - X position in CSS pixels
     * @param {number} y - Y position in CSS pixels
     * @param {number[]} color - RGBA normalized color
     * @param {number} size - Font size in CSS pixels (used for scaling)
     */
    pushGlyph(char, font, x, y, color, size = 16) {
        if (!this.initialized) return;
        if (this.instanceCount >= this.maxInstances) this.flush();

        const glyph = this.atlas.getGlyph(char, font);
        if (!glyph) return;

        const offset = this.instanceCount * 14;
        const dpr = window.devicePixelRatio || 1;
        
        // Scale factor: glyphs are generated at 48px base
        const baseSize = 48;
        const scale = (size / baseSize);

        this.instanceData[offset + 0] = (x - (glyph.pixelWidth * scale / 2)) * dpr;
        this.instanceData[offset + 1] = (y - (glyph.pixelHeight * scale / 2)) * dpr;
        this.instanceData[offset + 2] = glyph.pixelWidth * scale * dpr;
        this.instanceData[offset + 3] = glyph.pixelHeight * scale * dpr;

        // UVs from atlas
        this.instanceData[offset + 4] = glyph.u;
        this.instanceData[offset + 5] = glyph.v;
        this.instanceData[offset + 6] = glyph.width;
        this.instanceData[offset + 7] = glyph.height;

        // Color
        this.instanceData[offset + 8] = color[0];
        this.instanceData[offset + 9] = color[1];
        this.instanceData[offset + 10] = color[2];
        this.instanceData[offset + 11] = color[3];

        // Metadata
        this.instanceData[offset + 12] = 1.0; // Type: 1 = SDF Text
        this.instanceData[offset + 13] = 0.0; // Radius (unused for text)

        this.instanceCount++;
    }

    /**
     * Commits all queued commands to the GPU in a single instanced draw call.
     */
    flush() {
        if (!this.initialized || this.instanceCount === 0) return;

        const gl = this.gl;
        gl.useProgram(this.batchProgram);

        // Update global uniforms
        ShaderManager.setUniforms(gl, this.batchProgram, {
            u_resolution: [gl.canvas.width, gl.canvas.height],
            u_atlas: 0
        });

        // Bind atlas texture to unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.atlas.texture);

        // Upload instance data with orphaning
        const view = this.instanceData.subarray(0, this.instanceCount * 14);
        BufferManager.updateInstanceBuffer(gl, this.batchVAO.instanceVbo, view);

        // Execute instanced draw
        gl.bindVertexArray(this.batchVAO.vao);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.instanceCount);
        
        gl.bindVertexArray(null);
        this.instanceCount = 0;
    }

    /**
     * Compatibility wrapper for single-rect drawing.
     * Redirects to the batch pipeline.
     */
    drawPrimitive(rect, color, radius) {
        this.pushRect(rect, color, radius);
        this.flush();
    }

    /**
     * Determines which display element to track based on active mode.
     * @returns {HTMLElement|null}
     */
    getActiveDisplayElement() {
        const isScientific = document.body.classList.contains('scientific-mode');
        const isMobile = window.innerWidth <= 1024;
        const sidebar = document.getElementById('sidebar');

        // Initial check: is the display container visible?
        if (isMobile && sidebar && !sidebar.classList.contains('open')) {
            return null;
        }

        if (isScientific) {
            // Track the active or primary math field for precise "hugging"
            const activeMf = document.activeElement && document.activeElement.tagName === 'MATH-FIELD' 
                ? document.activeElement 
                : document.querySelector('math-field');
            
            // Priority: Active Mf -> Scientific Container -> Sidebar (too broad, fallback)
            return activeMf || document.getElementById('sci-container') || sidebar;
        }

        // Standard Mode
        return document.getElementById('main-calc-display') || sidebar;
    }

    /**
     * Main rendering loop integration. 
     */
    render() {
        if (!this.initialized) return;

        this.context.clear([0, 0, 0, 0]);

        // Dynamically detect active UI target
        const displayEl = this.getActiveDisplayElement();
        if (displayEl) {
            const rect = displayEl.getBoundingClientRect();
            
            // Skip rendering if element is hidden or zero-sized
            if (rect.width === 0 || rect.height === 0) {
                this.flush();
                return;
            }

            // Skip if element is clearly off-screen (sidebar fully closed)
            // Use a small buffer to ensure visibility during the very end of transitions
            if (rect.right < -10 || rect.left > window.innerWidth + 10) {
                this.flush();
                return;
            }
            
            // Draw background highlight using the batch pipeline
            this.pushRect({
                x: rect.left - 8,
                y: rect.top - 8,
                width: rect.width + 16,
                height: rect.height + 16
            }, [
                this.themeColors.primary[0],
                this.themeColors.primary[1],
                this.themeColors.primary[2],
                0.15
            ], 16);
            
            // Demonstrate text batching (Verification)
            // Position symbols at the vertical center of the detected area
            const centerY = rect.top + rect.height / 2;
            this.pushGlyph('Σ', 'bold 48px Inter', rect.left + 24, centerY, this.themeColors.primary, 24);
            this.pushGlyph('π', 'bold 48px Inter', rect.right - 40, centerY, this.themeColors.primary, 24);
        }

        // Single flush for all UI elements
        this.flush();
    }
}

