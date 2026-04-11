/**
 * ui/webgl/atlas.js
 * Texture atlas management and SDF generation for high-fidelity typography.
 */

export class SDFGenerator {
  /**
   * Generates SDF data for a given character and font.
   * @param {string} char - The character to rasterize.
   * @param {string} font - CSS font string.
   * @param {Object} options - Custom generation options.
   * @returns {Object} { data: Uint8Array, width, height }
   */
  static generate(char, font, options = {}) {
    const fontSize = options.fontSize || 48;
    const buffer = options.buffer || 8;
    const radius = options.radius || 8;

    // Use a temporary canvas to measure text
    const canvas = new OffscreenCanvas(
      fontSize + buffer * 2,
      fontSize + buffer * 2
    );
    const ctx = canvas.getContext('2d');
    ctx.font = font;

    const metrics = ctx.measureText(char);
    const width = Math.ceil(metrics.width) + buffer * 2;
    const height = fontSize + buffer * 2;

    canvas.width = width;
    canvas.height = height;

    // Redraw with correct size
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText(char, width / 2, height / 2);

    const imgData = ctx.getImageData(0, 0, width, height);
    const alphaChannel = new Uint8Array(width * height);
    for (let i = 0; i < alphaChannel.length; i++) {
      alphaChannel[i] = imgData.data[i * 4 + 3];
    }

    const sdfData = this.computeSDF(alphaChannel, width, height, radius);

    return {
      data: sdfData,
      width,
      height,
    };
  }

  /**
   * Computes SDF from alpha channel using a separable 1D distance transform.
   */
  static computeSDF(alpha, width, height, radius) {
    const grid1 = new Float64Array(width * height);
    const grid2 = new Float64Array(width * height);
    const INF = 1e10;

    for (let i = 0; i < width * height; i++) {
      const a = alpha[i] / 255; // 0.0 to 1.0
      grid1[i] =
        a === 1 ? 0 : a === 0 ? INF : Math.pow(Math.max(0, 0.5 - a), 2);
      grid2[i] =
        a === 1 ? INF : a === 0 ? 0 : Math.pow(Math.max(0, a - 0.5), 2);
    }

    const dist1 = this.edt(grid1, width, height);
    const dist2 = this.edt(grid2, width, height);

    const res = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const d = Math.sqrt(dist1[i]) - Math.sqrt(dist2[i]);
      res[i] = Math.max(
        0,
        Math.min(255, Math.round(127.5 - (127.5 * d) / radius))
      );
    }

    return res;
  }

  /**
   * 2D Euclidean Distance Transform by Felzenszwalb & Huttenlocher
   */
  static edt(data, width, height) {
    const f = new Float64Array(Math.max(width, height));
    const d = new Float64Array(Math.max(width, height));
    const v = new Int32Array(Math.max(width, height));
    const z = new Float64Array(Math.max(width, height) + 1);

    const res = new Float64Array(width * height);

    // Pass 1: horizontal
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) f[x] = data[y * width + x];
      this.edt1d(f, d, v, z, width);
      for (let x = 0; x < width; x++) res[y * width + x] = d[x];
    }

    // Pass 2: vertical
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) f[y] = res[y * width + x];
      this.edt1d(f, d, v, z, height);
      for (let y = 0; y < height; y++) res[y * width + x] = d[y];
    }

    return res;
  }

  /**
   * 1D Distance Transform
   */
  static edt1d(f, d, v, z, n) {
    v[0] = 0;
    z[0] = -Infinity;
    z[1] = Infinity;

    for (let q = 1, k = 0; q < n; q++) {
      let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) {
        k--;
        s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = Infinity;
    }

    for (let q = 0, k = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
  }
}

export class TextureAtlas {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Object} options
   */
  constructor(gl, options = {}) {
    this.gl = gl;
    this.size = options.size || 2048;
    this.padding = options.padding || 2;
    this.glyphs = new Map();

    this.shelfX = 0;
    this.shelfY = 0;
    this.shelfHeight = 0;

    this.initTexture();
  }

  initTexture() {
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

    // Use R8 for single-channel SDF storage
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.R8,
      this.size,
      this.size,
      0,
      this.gl.RED,
      this.gl.UNSIGNED_BYTE,
      null
    );

    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
  }

  /**
   * Gets UV coordinates for a glyph, generating it if not present.
   * @param {string} char
   * @param {string} font
   */
  getGlyph(char, font) {
    const key = `${char}:${font}`;
    if (this.glyphs.has(key)) {
      return this.glyphs.get(key);
    }

    const sdf = SDFGenerator.generate(char, font);
    const rect = this.pack(sdf.width, sdf.height);

    if (!rect) {
      console.warn('Texture Atlas full. Clearing and rebuilding.');
      this.clear();
      return this.getGlyph(char, font);
    }

    this.upload(sdf.data, rect.x, rect.y, sdf.width, sdf.height);

    const glyph = {
      u: rect.x / this.size,
      v: rect.y / this.size,
      width: sdf.width / this.size,
      height: sdf.height / this.size,
      pixelWidth: sdf.width,
      pixelHeight: sdf.height,
    };

    this.glyphs.set(key, glyph);
    return glyph;
  }

  /**
   * Shelf packing algorithm.
   */
  pack(width, height) {
    if (this.shelfX + width + this.padding > this.size) {
      this.shelfX = 0;
      this.shelfY += this.shelfHeight + this.padding;
      this.shelfHeight = 0;
    }

    if (this.shelfY + height + this.padding > this.size) {
      return null; // Atlas overflow
    }

    const rect = { x: this.shelfX, y: this.shelfY };
    this.shelfX += width + this.padding;
    this.shelfHeight = Math.max(this.shelfHeight, height);

    return rect;
  }

  /**
   * Uploads SDF data to a sub-region of the atlas texture.
   */
  upload(data, x, y, width, height) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    // Explicitly set pixel storage alignment for single channel data
    this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
    this.gl.texSubImage2D(
      this.gl.TEXTURE_2D,
      0,
      x,
      y,
      width,
      height,
      this.gl.RED,
      this.gl.UNSIGNED_BYTE,
      data
    );
  }

  /**
   * Resets the atlas.
   */
  clear() {
    this.glyphs.clear();
    this.shelfX = 0;
    this.shelfY = 0;
    this.shelfHeight = 0;
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.R8,
      this.size,
      this.size,
      0,
      this.gl.RED,
      this.gl.UNSIGNED_BYTE,
      null
    );
  }
}
