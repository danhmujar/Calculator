/**
 * WebGLContext - Manages the Raw WebGL 2.0 rendering layer.
 * Implements the Underlay Pattern (z-index: -1).
 */
export class WebGLContext {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'webgl-underlay';
    this.onRestored = null;

    // Attributes optimized for 2D UI underlay rendering
    const attributes = {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    };

    this.gl = this.canvas.getContext('webgl2', attributes);

    if (!this.gl) {
      console.error(
        'WebGL 2.0 not supported. Falling back to CSS-only background.'
      );
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
      display: 'block',
    });
  }

  /**
   * Binds lifecycle events for context loss/restoration.
   */
  setupEventListeners() {
    this.canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault();
        console.warn('WebGL context lost.');
      },
      false
    );

    this.canvas.addEventListener(
      'webglcontextrestored',
      () => {
        console.info('WebGL context restored.');
        this.resize();
        if (this.onRestored) this.onRestored();
      },
      false
    );
  }

  /**
   * Resizes the canvas to match the viewport, accounting for device pixel ratio.
   */
  resize() {
    if (!this.gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.0); // Cap at 2.0 for performance/thermal (REQ-VER-03)
    const width = window.innerWidth;
    const height = window.innerHeight;

    const displayWidth = Math.floor(width * dpr);
    const displayHeight = Math.floor(height * dpr);

    if (
      this.canvas.width !== displayWidth ||
      this.canvas.height !== displayHeight
    ) {
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

  /**
   * Executes an instanced draw call.
   * @param {number} mode - Drawing mode (gl.TRIANGLES, gl.TRIANGLE_STRIP, etc.)
   * @param {number} first - Starting vertex index
   * @param {number} count - Number of vertices per instance
   * @param {number} instanceCount - Number of instances to draw
   */
  drawInstanced(mode, first, count, instanceCount) {
    if (!this.gl || instanceCount <= 0) return;
    this.gl.drawArraysInstanced(mode, first, count, instanceCount);
  }

  /**
   * Creates a Framebuffer Object (FBO) with an attached texture.
   * Sets gl.LINEAR filtering to support Kawase blur (Pitfall 1).
   * @param {number} width - Texture width
   * @param {number} height - Texture height
   * @returns {Object} { framebuffer, texture, width, height }
   */
  createFramebuffer(width, height) {
    const gl = this.gl;
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );

    // Required for Kawase blur and non-power-of-two textures
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer is incomplete:', status);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return { framebuffer, texture, width, height };
  }
}
