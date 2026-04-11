const isBrowser =
  typeof window !== 'undefined' && typeof document !== 'undefined';

export class Renderer {
  constructor() {
    this.rafId = null;
    this.queue = new Set();
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
      const scheduleFrame = isBrowser
        ? requestAnimationFrame
        : (cb) => setTimeout(cb, 16);
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
}

// Ensure single export bindings point to same reference class, for convenience mapping in smaller apps.
export const renderer = new Renderer();
