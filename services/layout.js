/**
 * LayoutManager - Non-blocking DOM geometry synchronization
 * Uses ResizeObserver to track element rects and sync to the Store.
 * Eliminates getBoundingClientRect calls from the render loop.
 */
import { store } from './store.js';

class LayoutManager {
  constructor() {
    this.observer = new ResizeObserver((entries) => {
      this._handleResize(entries);
    });
    this.elements = new Map(); // element -> id

    // Window resize can move elements even if they don't resize themselves
    window.addEventListener('resize', () => this.refreshAll());
  }

  /**
   * Re-calculate geometry for all tracked elements.
   */
  refreshAll() {
    store.batch(() => {
      for (const [element, id] of this.elements.entries()) {
        this._updateRect(element, id);
      }
    });
  }

  /**
   * Start tracking an element's geometry.
   * @param {HTMLElement} element - The DOM element to track.
   * @param {string} id - Unique identifier for the element in the Store.
   */
  observe(element, id) {
    if (!element || !id) return;
    this.elements.set(element, id);
    this.observer.observe(element);

    // Initial sync
    this._updateRect(element, id);
  }

  /**
   * Stop tracking an element.
   * @param {HTMLElement} element
   */
  unobserve(element) {
    if (!element) return;
    this.observer.unobserve(element);
    this.elements.delete(element);
  }

  /**
   * Get the cached rect for an element.
   * @param {HTMLElement} element
   * @returns {Object} {x, y, w, h}
   */
  getRect(element) {
    const id = this.elements.get(element);
    if (id && store.state.layout && store.state.layout[id]) {
      const cached = store.state.layout[id];
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      // Convert document-relative back to viewport-relative
      return {
        left: cached.x - scrollX,
        top: cached.y - scrollY,
        width: cached.w,
        height: cached.h,
        right: cached.x - scrollX + cached.w,
        bottom: cached.y - scrollY + cached.h,
      };
    }
    return element.getBoundingClientRect();
  }

  _handleResize(entries) {
    store.batch(() => {
      for (const entry of entries) {
        const id = this.elements.get(entry.target);
        if (id) {
          this._updateRect(entry.target, id);
        }
      }
    });
  }

  _updateRect(element, id) {
    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Ensure layout object exists
    if (!store.state.layout) {
      store.state.layout = {};
    }

    // Store as document-relative coordinates
    store.state.layout[id] = {
      x: rect.left + scrollX,
      y: rect.top + scrollY,
      w: rect.width,
      h: rect.height,
    };
  }
}

export const layoutManager = new LayoutManager();
