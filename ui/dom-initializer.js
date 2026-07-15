import { layoutManager } from '../services/core/layout.js';

export class DOMInitializer {
  constructor(getWebglContext, getWebglRenderer) {
    this.getWebglContext = getWebglContext;
    this.getWebglRenderer = getWebglRenderer;
  }

  init() {
    this.setupEntranceAnimations();
    this.setupResizeHandler();
    this.setupA11y();
    this.setupKeyboardShortcuts();
    this.setupPasteSupport();
    this.setupFocusHandling();
  }

  get webgl() {
    return this.getWebglContext();
  }

  get webglRenderer() {
    return this.getWebglRenderer();
  }

  setupEntranceAnimations() {
    const header = document.querySelector('.left-panel header');
    if (header) {
      header.classList.add('anim-fade-up');
      header.style.animationDelay = '0.05s';
    }
    document.querySelectorAll('.calc-card').forEach((card, i) => {
      card.classList.add('anim-fade-up');
      card.style.animationDelay = `${0.1 + i * 0.08}s`;
    });
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
      rightPanel.classList.add('anim-slide-right');
      rightPanel.style.animationDelay = '0.1s';
      rightPanel.addEventListener(
        'animationend',
        () => {
          rightPanel.classList.remove('anim-slide-right');
        },
        { once: true }
      );
      if (window.innerWidth > 1024) {
        rightPanel.addEventListener(
          'animationend',
          () => {
            rightPanel.classList.add('open');
            document.body.classList.add('drawer-open');
          },
          { once: true }
        );
      }
    }
  }

  syncLayoutDuringTransition(durationMs = 600) {
    const start = performance.now();
    const tick = (now) => {
      layoutManager.refreshAll();
      if (this.webglRenderer) this.webglRenderer.render();
      if (now - start < durationMs) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }

  setupResizeHandler() {
    const rightPanel = document.querySelector('.right-panel');
    let wasMobile = window.innerWidth <= 1024;
    window.addEventListener('resize', () => {
      const isDesktop = window.innerWidth > 1024;
      if (
        isDesktop &&
        wasMobile &&
        rightPanel &&
        !rightPanel.classList.contains('open')
      ) {
        void rightPanel.offsetWidth;
        requestAnimationFrame(() => {
          rightPanel.classList.add('open');
          document.body.classList.add('drawer-open');
        });
        this.syncLayoutDuringTransition(600);
      } else if (
        !isDesktop &&
        !wasMobile &&
        rightPanel &&
        rightPanel.classList.contains('open')
      ) {
        // When moving from Desktop to Mobile, close the drawer automatically
        // Disable transition to prevent it from 'flying' across the screen
        rightPanel.style.transition = 'none';
        void rightPanel.offsetWidth;
        requestAnimationFrame(() => {
          rightPanel.classList.remove('open');
          document.body.classList.remove('drawer-open');
          // Fast delay to re-enable transitions after the class is removed
          setTimeout(() => {
            rightPanel.style.transition = '';
          }, 50);
        });
        this.syncLayoutDuringTransition(100);
      } else {
        // Regular resize
        this.syncLayoutDuringTransition(300);
      }
      wasMobile = !isDesktop;
      if (this.webgl) this.webgl.resize();
      if (this.webglRenderer) this.webglRenderer.render();
    });
  }

  setupA11y() {
    document
      .querySelectorAll('button[title]:not([aria-label])')
      .forEach((btn) => {
        btn.setAttribute('aria-label', btn.getAttribute('title'));
      });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (
        e.target.tagName.toLowerCase() === 'input' ||
        e.target.tagName.toLowerCase() === 'math-field'
      )
        return;
      const sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('scientific-active')) return;
    });
  }

  setupPasteSupport() {}

  setupFocusHandling() {
    setTimeout(() => {
      if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.addEventListener(
          'virtual-keyboard-toggle',
          () => {
            if (window.mathVirtualKeyboard.visible) {
              const target =
                document.querySelector('math-field.last-focused') ||
                document.querySelector('math-field');
              if (target) {
                setTimeout(() => target.focus(), 50);
              }
            }
          }
        );
      }
    }, 500);
  }
}
