const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * ES6 Map-based LRU Cache for O(1) text measurement access with fixed capacity.
 */
export class LRUCache extends Map {
  constructor(capacity) {
    super();
    this.capacity = capacity;
  }
  get(key) {
    if (!super.has(key)) return undefined;
    const val = super.get(key);
    super.delete(key);
    super.set(key, val);
    return val;
  }
  set(key, value) {
    if (super.has(key)) super.delete(key);
    super.set(key, value);
    if (this.size > this.capacity) {
      this.delete(this.keys().next().value);
    }
    return this;
  }
}

export class Renderer {
  constructor() {
    this.rafId = null;
    this.queue = new Set();
    
    // Setup offscreen canvas for font measuring.
    // Graceful check for server-side evaluation contexts (e.g., node verification tests).
    if (isBrowser) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    } else {
      this.ctx = {
        measureText: (chars) => ({ width: chars.length * 60 }) // Mock for Node.js
      };
    }
    
    this.referenceFontSize = 100; // 100px scaling metric base
    if (this.ctx && typeof this.ctx.font !== 'undefined') {
      this.ctx.font = `${this.referenceFontSize}px sans-serif`;
    }
    
    // O(1) LRU cache storage with 1000 item capacity to prevent memory leaks
    this.textWidthCache = new LRUCache(1000);
  }

  /**
   * Batch DOM updates. Call `requestAnimationFrame` only once per frame,
   * executing all queued callbacks at the same time.
   * @param {Function} callback 
   */
  schedule(callback) {
    if (this.queue.has(callback)) return;
    this.queue.add(callback);
    
    if (this.rafId === null) {
      const scheduleFrame = isBrowser ? requestAnimationFrame : (cb) => setTimeout(cb, 16);
      this.rafId = scheduleFrame(() => {
        this.flush();
      });
    }
  }

  /**
   * Execute callback queue
   */
  flush() {
    this.rafId = null;
    const callbacks = Array.from(this.queue);
    this.queue.clear();

    for (const cb of callbacks) {
      try {
        cb();
      } catch (err) {
        console.error('Renderer layout batched writing error:', err);
      }
    }
  }

  /**
   * Dynamically shrink font size to fit container width without layout thrashing.
   * @param {string} text Text to evaluate
   * @param {number} containerWidth Width text must fit inside
   * @param {{minRem: number, maxRem: number, remToPx: number}} options
   * @returns {{text: string, fontSizeRem: number}} Formatted payload
   */
  fitDisplayText(text, containerWidth, options = {}) {
    const strText = String(text);
    
    // O(1) Absolute fast-path: prioritized cache hit
    let textWidthRef = this.textWidthCache.get(strText);

    // Defaults safely based on the UI CSS constants.
    const minRem = options.minRem || 1;
    const maxRem = options.maxRem || 3.5;
    const remToPx = options.remToPx || 16;
    
    if (textWidthRef === undefined) {
      // Calculate layout at exactly 100px font base, using Canvas layout engine.
      textWidthRef = this.ctx.measureText(strText).width;
      this.textWidthCache.set(strText, textWidthRef);
    }
    
    if (textWidthRef === 0 || containerWidth <= 0) {
      // Return maximum size if container is not yet ready or hidden to avoid "tiny font" flicker (REQ-UI-06)
      return { text: strText, fontSizeRem: maxRem };
    }

    // Required font size logic to fit identical width ratio.
    const requiredSizePx = (containerWidth / textWidthRef) * this.referenceFontSize;
    const requiredSizeRem = requiredSizePx / remToPx;
    
    let finalSizeRem = Math.max(minRem, Math.min(requiredSizeRem, maxRem));
    let finalText = strText;

    // Fallback to scienfitic notation if text surpasses container bounds even at minimum possible size.
    // Ensure containerWidth is valid to avoid false positives during layout transitions (REQ-UI-06).
    if (requiredSizeRem < minRem && containerWidth > 0) {
      const parsedNum = Number(strText.replace(/,/g, ''));
      if (!isNaN(parsedNum) && strText.trim().length > 0) {
        // Render large figures via toExponential. 
        finalText = parsedNum.toExponential(4);
        finalSizeRem = minRem;
      }
    }

    return {
      text: finalText,
      fontSizeRem: finalSizeRem
    };
  }
}

// Ensure single export bindings point to same reference class, for convenience mapping in smaller apps.
export const renderer = new Renderer();
