const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

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
    
    // O(1) cache storage
    this.textWidthCache = new Map();
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
    // Defaults safely based on the UI CSS constants.
    const minRem = options.minRem || 1;
    const maxRem = options.maxRem || 3.5;
    const remToPx = options.remToPx || 16;
    
    const strText = String(text);
    
    let textWidthRef = this.textWidthCache.get(strText);
    if (textWidthRef === undefined) {
      // Calculate layout at exactly 100px font base, using Canvas layout engine.
      textWidthRef = this.ctx.measureText(strText).width;
      this.textWidthCache.set(strText, textWidthRef);
    }
    
    if (textWidthRef === 0) {
      return { text: strText, fontSizeRem: maxRem };
    }

    // Required font size logic to fit identical width ratio.
    const requiredSizePx = (containerWidth / textWidthRef) * this.referenceFontSize;
    const requiredSizeRem = requiredSizePx / remToPx;
    
    let finalSizeRem = Math.max(minRem, Math.min(requiredSizeRem, maxRem));
    let finalText = strText;

    // Fallback to scienfitic notation if text surpasses container bounds even at minimum possible size.
    if (requiredSizeRem < minRem) {
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
