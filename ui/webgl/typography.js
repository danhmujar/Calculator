import { layoutManager } from '../../services/layout.js';

/**
 * TypographyManager - Bridges MathLive's DOM layout with the WebGL rendering layer.
 * 
 * This system extracts precise glyph positions from the MathLive Shadow DOM
 * and synchronizes them with the WebGL Batch Renderer.
 */
export class TypographyManager {
    constructor() {
        this.glyphs = [];
        this.callbacks = [];
        this.dirty = false;
        this._rafId = null;
        this._boundUpdate = this.update.bind(this);
        
        // Listen for events on the document for delegation (bubbles: true)
        // We use capture phase for some events to ensure we get them before MathLive consumes them if necessary
        document.addEventListener('input', this.handleEvent.bind(this), true);
        
        // MathLive specific events
        document.addEventListener('selection-change', this.handleEvent.bind(this), true);
        
        // Also listen for scroll events in the scientific container
        const sciContainer = document.querySelector('.scientific-container');
        if (sciContainer) {
            sciContainer.addEventListener('scroll', () => this.scheduleUpdate(), { passive: true });
        }
        
        // Also listen for resize to re-extract
        window.addEventListener('resize', () => this.scheduleUpdate());
    }

    /**
     * Registers a callback to be notified when layout data changes.
     * @param {Function} callback - Function receiving the updated glyph list.
     */
    onLayoutUpdate(callback) {
        this.callbacks.push(callback);
    }

    /**
     * Handles events from MathLive fields or other UI changes.
     */
    handleEvent(event) {
        const target = event.target;
        if (target && target.tagName === 'MATH-FIELD') {
            this.scheduleUpdate();
        }
    }

    /**
     * Schedules a batched layout update to occur on the next animation frame.
     */
    scheduleUpdate() {
        if (this._rafId) return;
        this._rafId = requestAnimationFrame(this._boundUpdate);
    }

    /**
     * Performs the layout extraction for all visible math-fields.
     */
    update() {
        this._rafId = null;
        
        // STRICT GUARD: Prevent WebGL 'Ghost Text' leaks
        // If we are not in scientific mode, purge all glyphs so the renderer doesn't draw them
        // under the transparent panels of Standard Mode.
        if (!document.body.classList.contains('scientific-mode')) {
            this.glyphs = [];
            this.callbacks.forEach(cb => cb(this.glyphs));
            return;
        }
        
        const mathFields = document.querySelectorAll('math-field');
        const sciContainer = document.querySelector('.scientific-container');
        
        // We need the container rect to filter glyphs that are scrolled out of view
        const containerRect = sciContainer ? layoutManager.getRect(sciContainer) : null;
        
        const allGlyphs = [];
        
        mathFields.forEach(mf => {
            const rect = layoutManager.getRect(mf);
            
            // Basic optimization: only extract if the math-field is at least partially in the viewport
            // and has dimensions (not display: none)
            if (rect.width > 0 && rect.height > 0 && 
                (!containerRect || (rect.bottom >= containerRect.top && rect.top <= containerRect.bottom))) {
                
                const glyphs = this.extractGlyphs(mf);
                
                // Filter glyphs by visibility within the scientific container
                if (containerRect) {
                    glyphs.forEach(g => {
                        // Allow some padding for smooth clipping
                        const padding = 20;
                        if (g.y + g.height >= containerRect.top - padding && 
                            g.y <= containerRect.bottom + padding) {
                            allGlyphs.push(g);
                        }
                    });
                } else {
                    allGlyphs.push(...glyphs);
                }
            }
        });
        
        this.glyphs = allGlyphs;
        
        // Notify subscribers
        this.callbacks.forEach(cb => cb(this.glyphs));
    }

    /**
     * Extracts glyph metadata from a single math-field's Shadow DOM.
     * Uses the Range API for precise character-level bounding boxes.
     * 
     * @param {HTMLElement} mf - The math-field element.
     * @returns {Array} List of glyph metadata objects.
     */
    extractGlyphs(mf) {
        if (!mf || !mf.shadowRoot) return [];

        const glyphs = [];
        // MathLive's internal rendering root
        // Different versions of MathLive use different root classes
        const root = mf.shadowRoot.querySelector('.ML__fieldcontainer__field') || 
                     mf.shadowRoot.querySelector('.ML__container') ||
                     mf.shadowRoot.querySelector('.ML__content');
        
        if (!root) return [];

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const range = document.createRange();
        let node;
        while (node = walker.nextNode()) {
            const parent = node.parentElement;
            if (!parent) continue;

            const text = node.textContent;
            if (!text || text.trim() === '') continue;

            // Skip internal MathLive caret/placeholder nodes
            if (parent.classList.contains('ML__caret') || 
                parent.classList.contains('ML__placeholder') ||
                parent.closest('.ML__caret') ||
                parent.closest('.ML__placeholder')) {
                continue;
            }

            const style = window.getComputedStyle(parent);
            
            // Construct a robust font string for the atlas generator
            const fontStyle = style.fontStyle || 'normal';
            const fontWeight = style.fontWeight || '400';
            const fontSize = style.fontSize || '16px';
            const fontFamily = style.fontFamily || 'serif';
            const font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
            
            const fontSizePx = parseFloat(fontSize);

            for (let i = 0; i < text.length; i++) {
                // Skip common whitespace characters
                if (text[i] === ' ' || text[i] === '\u00A0' || text[i] === '\t' || text[i] === '\n') continue;

                try {
                    range.setStart(node, i);
                    range.setEnd(node, i + 1);
                    
                    // getBoundingClientRect on a range for a single character 
                    // is the most accurate way to get its position in viewport space.
                    const charRect = range.getBoundingClientRect();
                    
                    if (charRect.width > 0 && charRect.height > 0) {
                        glyphs.push({
                            char: text[i],
                            font: font,
                            fontFamily: fontFamily,
                            fontSize: fontSizePx,
                            x: charRect.left,
                            y: charRect.top,
                            width: charRect.width,
                            height: charRect.height
                        });
                    }
                } catch (e) {
                    // Range selection might fail in some edge cases of dynamic DOM updates
                    continue;
                }
            }
        }

        return glyphs;
    }

    /**
     * Returns all currently visible glyphs in the viewport.
     * Enforces a strict mode guard to prevent stale scientific glyphs
     * from leaking into Standard Mode renders.
     * @returns {Array} Array of glyph metadata.
     */
    getVisibleGlyphs() {
        if (!document.body.classList.contains('scientific-mode')) {
            return [];
        }
        return this.glyphs;
    }
}
