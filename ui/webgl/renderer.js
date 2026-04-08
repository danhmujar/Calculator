import { ShaderManager, PRIMITIVE_VERT, PRIMITIVE_FRAG, BATCH_VERT, BATCH_FRAG } from './shaders.js';
import { BufferManager } from './buffers.js';
import { TextureAtlas } from './atlas.js';
import { layoutManager } from '../../services/layout.js';
import { themeManager } from '../../services/theme.js';

/**
 * WebGLRenderer - Main rendering engine for high-performance UI primitives.
 * Implements an instanced Batch Renderer to provide GPU-accelerated 
 * backgrounds and text for DOM-based components in a single draw call.
 */
export class WebGLRenderer {
    /**
     * @param {WebGLContext} webglContext - The context manager instance
     * @param {TypographyManager} typography - Optional typography manager for text extraction
     */
    constructor(webglContext, typography = null) {
        if (!webglContext || !webglContext.gl) {
            console.error('WebGLRenderer: A valid WebGLContext is required.');
            return;
        }

        this.context = webglContext;
        this.gl = webglContext.gl;
        this.typography = typography;
        
        // Pipeline state
        this.batchProgram = null;
        this.batchVAO = null;
        this.atlas = null;
        
        // Batch configuration
        this.maxInstances = 4096; // Increased for full coverage
        this.instanceData = new Float32Array(this.maxInstances * 24);
        this.instanceCount = 0;
        
        // Global UBO state
        this.globalUBO = null;
        this.globalData = new Float32Array(8); // std140: 32 bytes aligned (8 floats)
        
        // Layout history for interpolation (id -> { startRect, endRect, startColor, endColor, startTime, duration })
        this.layoutHistory = new Map();
        
        this.initialized = false;
        
        // FBO state
        this.fboA = null;
        this.fboB = null;
        this.primitiveProgram = null;
        this.primitiveVAO = null;

        // BTS theme texture
        this.btsBackgroundTex = null;
        this.btsTexLoaded = false;

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
        this.setupResizeObserver();
        this.setupThemeObserver();
        this.startAnimationLoop();
    }

    startAnimationLoop() {
        if (this._animId) return;
        const tick = () => {
            this._animId = requestAnimationFrame(tick);
            // Continuous render for u_time based effects (Aurora, BTS bubbles, Grain)
            if (document.body.classList.contains('webgl-active')) {
                this.render();
            }
        };
        this._animId = requestAnimationFrame(tick);
    }

    /**
     * Attaches a ResizeObserver to the document body to handle layout changes.
     */
    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(() => {
            this.handleResize();
        });
        this.resizeObserver.observe(document.body);
    }

    /**
     * Observes class changes on the body element to trigger theme transitions.
     */
    setupThemeObserver() {
        this.themeObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class') {
                    themeManager.updateTargetTheme();
                    break;
                }
            }
        });

        this.themeObserver.observe(document.body, { attributes: true });
    }

    /**
     * Coordinates the resize sequence: canvas -> viewport -> FBOs.
     */
    handleResize() {
        if (!this.initialized) return;
        
        // 1. Update the main WebGL context (Canvas size & Viewport)
        this.context.resize();
        
        // 2. Recreate FBOs at the new resolution
        this.resizeFBOs();
        
        // 3. Force a re-render to prevent flickering
        this.render();
    }

    /**
     * Bootstraps the WebGL pipeline (Shaders, Programs, VAOs).
     */
    init() {
        try {
            const gl = this.gl;
            
            // Initialize theme manager state from current DOM
            themeManager.init();

            // Batch rendering pipeline (Unified primitives & text)
            this.batchProgram = ShaderManager.createProgram(gl, BATCH_VERT, BATCH_FRAG);
            this.batchVAO = BufferManager.createInstancedVAO(gl, this.quadData, this.maxInstances);
            this.atlas = new TextureAtlas(gl);

            // Blur rendering pipeline (Kawase Blur)
            this.primitiveProgram = ShaderManager.createProgram(gl, PRIMITIVE_VERT, PRIMITIVE_FRAG);
            this.primitiveVAO = BufferManager.createVAO(gl, [
                -1, -1, 0, 0, // Bottom-left
                 1, -1, 1, 0, // Bottom-right
                -1,  1, 0, 1, // Top-left
                 1,  1, 1, 1  // Top-right
            ]);

            // Initialize FBOs for ping-pong blur
            this.resizeFBOs();

            // 1. Setup Global UBO (32 bytes for std140 layout)
            this.globalUBO = BufferManager.createUBO(gl, 32, 0);

            // 2. Link program to GlobalState uniform block at binding point 0
            const blockName = 'GlobalState';
            const index = gl.getUniformBlockIndex(this.batchProgram, blockName);
            if (index !== gl.INVALID_INDEX) {
                gl.uniformBlockBinding(this.batchProgram, index, 0);
            }
            const primIndex = gl.getUniformBlockIndex(this.primitiveProgram, blockName);
            if (primIndex !== gl.INVALID_INDEX) {
                gl.uniformBlockBinding(this.primitiveProgram, primIndex, 0);
            }
            
            // Enable alpha blending for the underlay pattern
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            this.initialized = true;
            console.info('WebGLRenderer: Instanced batch rendering pipeline initialized.');

            // Load BTS background texture asynchronously
            this.loadBTSTexture();
        } catch (error) {
            console.error('WebGLRenderer: Pipeline initialization failed:', error);
            this.initialized = false;
        }
    }

    /**
     * Resizes or initializes the FBOs to match the current canvas dimensions.
     * Uses a 1/4 resolution for the blur passes to optimize performance (Pitfall 3).
     */
    resizeFBOs() {
        const gl = this.gl;
        const width = gl.canvas.width;
        const height = gl.canvas.height;
        
        const blurWidth = Math.max(1, Math.floor(width / 4));
        const blurHeight = Math.max(1, Math.floor(height / 4));

        if (this.fboA) {
            gl.deleteFramebuffer(this.fboA.framebuffer);
            gl.deleteTexture(this.fboA.texture);
        }
        if (this.fboB) {
            gl.deleteFramebuffer(this.fboB.framebuffer);
            gl.deleteTexture(this.fboB.texture);
        }

        this.fboA = this.context.createFramebuffer(blurWidth, blurHeight);
        this.fboB = this.context.createFramebuffer(blurWidth, blurHeight);
    }

    /**
     * Asynchronously loads the BTS background image as a WebGL texture.
     */
    loadBTSTexture() {
        if (this.btsBackgroundTex) return; // Already loaded or loading

        const gl = this.gl;
        
        // Create a 1x1 placeholder texture immediately
        this.btsBackgroundTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.btsBackgroundTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([26, 6, 51, 255]) // Dark purple placeholder
        );

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.btsBackgroundTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            this.btsTexLoaded = true;
            console.info('WebGLRenderer: BTS background texture loaded.');
            this.render();
        };
        img.onerror = () => {
            console.warn('WebGLRenderer: Failed to load BTS background texture.');
        };
        img.src = './assets/bts_chibi_bg_1775310615594.png';
    }

    /**
     * Helper to track and retrieve transition states for an element.
     * 
     * @param {string} id - Unique identifier for the layout object
     * @param {Object} currentRect - Target {x, y, width, height}
     * @param {number[]} currentColor - Target [r, g, b, a]
     * @param {number} durationMs - Animation duration in milliseconds
     * @returns {Object} Start/End states for GPU interpolation
     */
    getTransitionData(id, currentRect, currentColor, durationMs = 250) {
        const now = performance.now() / 1000.0;
        let history = this.layoutHistory.get(id);
        
        if (!history) {
            history = {
                startRect: { ...currentRect },
                endRect: { ...currentRect },
                startColor: [...currentColor],
                endColor: [...currentColor],
                startTime: now,
                duration: 0.0 // Instant
            };
            this.layoutHistory.set(id, history);
            return history;
        }

        // Check if target changed significantly
        const rectChanged = Math.abs(history.endRect.x - currentRect.x) > 0.1 || 
                           Math.abs(history.endRect.y - currentRect.y) > 0.1 ||
                           Math.abs(history.endRect.width - currentRect.width) > 0.1 ||
                           Math.abs(history.endRect.height - currentRect.height) > 0.1;
        
        const colorChanged = Math.abs(history.endColor[3] - currentColor[3]) > 0.01;

        if (rectChanged || colorChanged) {
            // Calculate current interpolated state to use as new start point (Seamless Transition)
            const t = history.duration > 0 ? Math.min(1.0, (now - history.startTime) / history.duration) : 1.0;
            const easedT = t * (2.0 - t); // Quadratic out matching shader
            
            const currentInterpRect = {
                x: history.startRect.x + (history.endRect.x - history.startRect.x) * easedT,
                y: history.startRect.y + (history.endRect.y - history.startRect.y) * easedT,
                width: history.startRect.width + (history.endRect.width - history.startRect.width) * easedT,
                height: history.startRect.height + (history.endRect.height - history.startRect.height) * easedT
            };

            const currentInterpColor = [
                history.startColor[0] + (history.endColor[0] - history.startColor[0]) * easedT,
                history.startColor[1] + (history.endColor[1] - history.startColor[1]) * easedT,
                history.startColor[2] + (history.endColor[2] - history.startColor[2]) * easedT,
                history.startColor[3] + (history.endColor[3] - history.startColor[3]) * easedT
            ];

            history.startRect = currentInterpRect;
            history.endRect = { ...currentRect };
            history.startColor = currentInterpColor;
            history.endColor = [...currentColor];
            history.startTime = now;
            history.duration = durationMs / 1000.0;
        }

        return history;
    }

    /**
     * Queues a rounded rectangle for the next batch flush.
     * 
     * @param {Object} rect - Dimensions {x, y, width, height} in CSS pixels
     * @param {number[]} color - RGBA normalized color [0.0, 1.0]
     * @param {number} radius - Corner radius in CSS pixels
     * @param {string} id - Optional ID for animation tracking
     */
    pushRect(rect, color, radius, id = null) {
        if (!this.initialized) return;
        if (this.instanceCount >= this.maxInstances) this.flush();

        const offset = this.instanceCount * 24;
        const dpr = window.devicePixelRatio || 1;
        
        let startRect = rect, endRect = rect;
        let startColor = color, endColor = color;
        let startTime = 0, duration = 0;

        if (id) {
            const trans = this.getTransitionData(id, rect, color);
            startRect = trans.startRect;
            endRect = trans.endRect;
            startColor = trans.startColor;
            endColor = trans.endColor;
            startTime = trans.startTime;
            duration = trans.duration;
        }

        // a_startRect (loc 2)
        this.instanceData[offset + 0] = startRect.x * dpr;
        this.instanceData[offset + 1] = startRect.y * dpr;
        this.instanceData[offset + 2] = startRect.width * dpr;
        this.instanceData[offset + 3] = startRect.height * dpr;
        
        // a_endRect (loc 3)
        this.instanceData[offset + 4] = endRect.x * dpr;
        this.instanceData[offset + 5] = endRect.y * dpr;
        this.instanceData[offset + 6] = endRect.width * dpr;
        this.instanceData[offset + 7] = endRect.height * dpr;

        // a_startColor (loc 4)
        this.instanceData[offset + 8] = startColor[0];
        this.instanceData[offset + 9] = startColor[1];
        this.instanceData[offset + 10] = startColor[2];
        this.instanceData[offset + 11] = startColor[3];

        // a_endColor (loc 5)
        this.instanceData[offset + 12] = endColor[0];
        this.instanceData[offset + 13] = endColor[1];
        this.instanceData[offset + 14] = endColor[2];
        this.instanceData[offset + 15] = endColor[3];

        // a_instUV (loc 6)
        this.instanceData[offset + 16] = 0;
        this.instanceData[offset + 17] = 0;
        this.instanceData[offset + 18] = 1;
        this.instanceData[offset + 19] = 1;

        // a_transition (loc 7)
        this.instanceData[offset + 20] = startTime;
        this.instanceData[offset + 21] = duration;

        // a_instType (loc 8) / a_instRadius (loc 9)
        this.instanceData[offset + 22] = 0.0; // Type: 0 = Rect
        this.instanceData[offset + 23] = radius * dpr;

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
     * @param {string} id - Optional ID for animation tracking
     */
    pushGlyph(char, font, x, y, color, size = 16, id = null) {
        if (!this.initialized) return;
        if (this.instanceCount >= this.maxInstances) this.flush();

        const glyph = this.atlas.getGlyph(char, font);
        if (!glyph) return;

        const offset = this.instanceCount * 24;
        const dpr = window.devicePixelRatio || 1;
        
        // Scale factor: glyphs are generated at 48px base
        const baseSize = 48;
        const scale = (size / baseSize);

        const rect = {
            x: x - (glyph.pixelWidth * scale / 2),
            y: y - (glyph.pixelHeight * scale / 2),
            width: glyph.pixelWidth * scale,
            height: glyph.pixelHeight * scale
        };

        let startRect = rect, endRect = rect;
        let startColor = color, endColor = color;
        let startTime = 0, duration = 0;

        if (id) {
            const trans = this.getTransitionData(id, rect, color);
            startRect = trans.startRect;
            endRect = trans.endRect;
            startColor = trans.startColor;
            endColor = trans.endColor;
            startTime = trans.startTime;
            duration = trans.duration;
        }

        // a_startRect (loc 2)
        this.instanceData[offset + 0] = startRect.x * dpr;
        this.instanceData[offset + 1] = startRect.y * dpr;
        this.instanceData[offset + 2] = startRect.width * dpr;
        this.instanceData[offset + 3] = startRect.height * dpr;
        
        // a_endRect (loc 3)
        this.instanceData[offset + 4] = endRect.x * dpr;
        this.instanceData[offset + 5] = endRect.y * dpr;
        this.instanceData[offset + 6] = endRect.width * dpr;
        this.instanceData[offset + 7] = endRect.height * dpr;

        // a_startColor (loc 4)
        this.instanceData[offset + 8] = startColor[0];
        this.instanceData[offset + 9] = startColor[1];
        this.instanceData[offset + 10] = startColor[2];
        this.instanceData[offset + 11] = startColor[3];

        // a_endColor (loc 5)
        this.instanceData[offset + 12] = endColor[0];
        this.instanceData[offset + 13] = endColor[1];
        this.instanceData[offset + 14] = endColor[2];
        this.instanceData[offset + 15] = endColor[3];

        // a_instUV (loc 6)
        this.instanceData[offset + 16] = glyph.u;
        this.instanceData[offset + 17] = glyph.v;
        this.instanceData[offset + 18] = glyph.width;
        this.instanceData[offset + 19] = glyph.height;

        // a_transition (loc 7)
        this.instanceData[offset + 20] = startTime;
        this.instanceData[offset + 21] = duration;

        // a_instType (loc 8) / a_instRadius (loc 9)
        this.instanceData[offset + 22] = 1.0; // Type: 1 = SDF Text
        this.instanceData[offset + 23] = 0.0; // Radius (unused for text)

        this.instanceCount++;
    }

    /**
     * Commits all queued commands to the GPU in a single instanced draw call.
     */
    flush() {
        if (!this.initialized || this.instanceCount === 0) return;

        const gl = this.gl;
        gl.useProgram(this.batchProgram);

        // Update remaining dynamic uniforms
        ShaderManager.setUniforms(gl, this.batchProgram, {
            u_atlas: 0
        });

        // Bind atlas texture to unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.atlas.texture);

        // Upload instance data with orphaning
        const view = this.instanceData.subarray(0, this.instanceCount * 24);
        BufferManager.updateInstanceBuffer(gl, this.batchVAO.instanceVbo, view);

        // Execute instanced draw
        gl.bindVertexArray(this.batchVAO.vao);
        this.context.drawInstanced(gl.TRIANGLE_STRIP, 0, 4, this.instanceCount);
        
        gl.bindVertexArray(null);
        this.instanceCount = 0;
    }

    /**
     * Compatibility wrapper for single-rect drawing.
     * Redirects to the batch pipeline.
     */
    drawPrimitive(rect, color, radius) {
        this.pushRect(rect, color, radius);
        // Do not flush immediately to allow further batching
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
     * Uses a single flush for all queued primitives.
     */
    render() {
        if (!this.initialized) return;

        const gl = this.gl;
        const theme = themeManager.getInterpolatedTheme(performance.now());

        // Ensure FBOs match current canvas dimensions (Pitfall 3)
        if (this.fboA && (this.fboA.width !== Math.max(1, Math.floor(gl.canvas.width / 4)) || 
                          this.fboA.height !== Math.max(1, Math.floor(gl.canvas.height / 4)))) {
            this.resizeFBOs();
        }

        // 1. Update Global UBO once per frame (std140 layout)
        this.globalData[0] = gl.canvas.width;
        this.globalData[1] = gl.canvas.height;
        this.globalData[2] = performance.now() / 1000.0;
        this.globalData[3] = window.devicePixelRatio || 1;
        this.globalData[4] = window.scrollX || 0;
        this.globalData[5] = window.scrollY || 0;
        
        BufferManager.updateUBO(gl, this.globalUBO, this.globalData);

        // Guard: Only render if WebGL mode is active in the DOM
        if (!document.body.classList.contains('webgl-active')) {
            this.context.clear([0, 0, 0, 0]);
            this.instanceCount = 0;
            return;
        }

        // --- STAGE 1: BLURRED BACKGROUND ---
        // Render background highlights to FBO A
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA.framebuffer);
        gl.viewport(0, 0, this.fboA.width, this.fboA.height);
        this.context.clear([0, 0, 0, 0]);

        this._drawBlurredStage();
        this.flush();

        // --- STAGE 2: KAWASE BLUR PING-PONG ---
        gl.useProgram(this.primitiveProgram);
        gl.bindVertexArray(this.primitiveVAO.vao);
        gl.activeTexture(gl.TEXTURE0);

        let currentSrc = this.fboA;
        let currentDest = this.fboB;

        const passes = [0.0, 1.0, 2.0, 3.0];
        for (const offset of passes) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, currentDest.framebuffer);
            gl.bindTexture(gl.TEXTURE_2D, currentSrc.texture);
            
            ShaderManager.setUniforms(gl, this.primitiveProgram, {
                uTexture: 0,
                uResolution: [currentDest.width, currentDest.height],
                uOffset: offset,
                uAuroraColor1: theme.uAuroraColor1,
                uAuroraColor2: theme.uAuroraColor2,
                uAuroraColor3: theme.uAuroraColor3,
                uBackgroundMode: theme.uBackgroundMode,
                uGrainIntensity: theme.uGrainIntensity,
                uIsFinalPass: 0.0 // Just doing the blur passes
            });

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // Swap FBOs for next pass
            [currentSrc, currentDest] = [currentDest, currentSrc];
        }

        // --- STAGE 3: FINAL COMPOSITION & SHARP UI ---
        // Back to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        this.context.clear([0, 0, 0, 0]);

        // Draw the final blurred texture as background
        gl.useProgram(this.primitiveProgram);
        gl.bindVertexArray(this.primitiveVAO.vao);
        gl.bindTexture(gl.TEXTURE_2D, currentSrc.texture);
        
        ShaderManager.setUniforms(gl, this.primitiveProgram, {
            uTexture: 0,
            uResolution: [gl.canvas.width, gl.canvas.height],
            uOffset: 0.0, // Pass-through for final composition & coloring
            uAuroraColor1: theme.uAuroraColor1,
            uAuroraColor2: theme.uAuroraColor2,
            uAuroraColor3: theme.uAuroraColor3,
            uBackgroundMode: theme.uBackgroundMode,
            uGrainIntensity: theme.uGrainIntensity,
            uIsFinalPass: 1.0, // Indicate this is the final composition
            uBackgroundTexture: 1
        });

        // Bind BTS background texture to unit 1 if active
        if (theme.uBackgroundMode === 2 && this.btsBackgroundTex && this.btsTexLoaded) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.btsBackgroundTex);
            gl.activeTexture(gl.TEXTURE0); // Reset active texture
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Draw sharp UI elements on top
        this._drawSharpStage();
        this.flush();
    }

    /**
     * Renders elements that should be blurred (Background highlights).
     */
    _drawBlurredStage() {
        if (document.body.classList.contains('mode-transitioning')) return;

        const viewportHeight = window.innerHeight;
        
        for (const [element, id] of layoutManager.elements.entries()) {
            const rect = layoutManager.getRect(element);
            if (rect.bottom < 0 || rect.top > viewportHeight) continue;

            const computedStyle = getComputedStyle(element);
            if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') continue;

            const isHovered = element.matches(':hover');

            if (element.classList.contains('calc-card')) {
                this.pushRect(rect, [1, 1, 1, isHovered ? 0.08 : 0.05], 8, id);
            } else if (element.classList.contains('btn') || element.classList.contains('icon-btn') || element.classList.contains('calc-btn')) {
                const isEq = element.classList.contains('eq');
                const isOp = element.classList.contains('op');
                const color = isEq ? this.themeColors.primary : (isOp ? this.themeColors.accent : this.themeColors.primary);
                this.pushRect(rect, [...color, isHovered ? 0.15 : 0.1], 12, id);
            } else if (element.classList.contains('about-modal')) {
                if (element.closest('.about-overlay.open')) {
                    // Frosty background for the about modal
                    this.pushRect(rect, [1.0, 1.0, 1.0, 0.25], 16, id);
                }
            } else if (element.classList.contains('math-row') || element.classList.contains('calc-row-instance')) {
                this.pushRect(rect, [...this.themeColors.primary, isHovered ? 0.1 : 0.05], 8, id);
            }
        }

        // Render standard mode sidebar glow to blurred stage
        if (!document.body.classList.contains('scientific-mode')) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                const sidebarRect = layoutManager.getRect(sidebar);
                if (sidebarRect.width > 0 && sidebarRect.height > 0) {
                    // Frosty glass background for the sidebar itself
                    this.pushRect({
                        x: sidebarRect.left,
                        y: sidebarRect.top,
                        width: sidebarRect.width,
                        height: sidebarRect.height
                    }, [1.0, 1.0, 1.0, 0.20], 0, 'sidebar-glass-bg');

                    this.pushRect({
                        x: sidebarRect.left - 8,
                        y: sidebarRect.top,
                        width: sidebarRect.width + 16,
                        height: sidebarRect.height
                    }, [
                        this.themeColors.primary[0],
                        this.themeColors.primary[1],
                        this.themeColors.primary[2],
                        0.08
                    ], 0, 'sidebar-glow-bg');
                }
            }
        }
    }

    /**
     * Renders elements that should remain sharp (Text, symbols, specific outlines).
     */
    _drawSharpStage() {
        this._drawTypography();

        const isScientific = document.body.classList.contains('scientific-mode');
        if (isScientific) {
            this._renderScientificSymbols();
        } else {
            this._renderStandardSymbols();
        }
    }

    /**
     * Renders all extracted typography glyphs.
     */
    _drawTypography() {
        if (!this.typography) return;
        const glyphs = this.typography.getVisibleGlyphs();
        glyphs.forEach((g, i) => {
            this.pushGlyph(g.char, g.font, g.x, g.y, this.themeColors.text, g.fontSize, `glyph-${i}`);
        });
    }

    /**
     * Renders WebGL highlights and decorative elements for the scientific rows.
     */
    _renderScientificSymbols() {
        if (document.body.classList.contains('mode-transitioning')) return;

        const rows = document.querySelectorAll('.math-row');
        const viewportHeight = window.innerHeight;

        rows.forEach((row, index) => {
            const rect = layoutManager.getRect(row);
            if (rect.bottom < 0 || rect.top > viewportHeight) return;

            // Render row decoration
            const centerY = rect.top + rect.height / 2;
            const indicatorX = rect.left + 24;
            this.pushGlyph('ƒ', 'italic 48px Inter', indicatorX, centerY, this.themeColors.primary, 18, `row-indicator-${index}`);
        });
    }

    /**
     * Renders WebGL elements for the standard calculator display.
     */
    _renderStandardSymbols() {
        // Removed as per user request
    }
}

