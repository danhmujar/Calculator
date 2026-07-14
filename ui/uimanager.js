import { store } from '../services/core/store.js';
import { layoutManager } from '../services/core/layout.js';
import { renderer } from './renderer.js';
import { CalculatorService } from '../services/math/calculator.ts';
import { WebGLContext } from './webgl/context.js';
import { WebGLRenderer } from './webgl/renderer.js';
import { TypographyManager } from './webgl/typography.js';
import { themeManager } from '../services/theme.js';
import { initEyeTracking } from './eye-tracker.js';
import { DisplayManager } from './display-manager.js';
import { AuditTrail } from './audit-trail.js';
import { ThemeCoordinator } from './theme-coordinator.js';
import { RowManager } from './row-manager.js';
import { ToastManager } from './toast-manager.js';

/**
 * UIManager - Coordinates DOM layout, theme management, and UI transitions.
 */
export class UIManager {
  constructor() {
    this.MATH_EXPR_LIMIT = 1000;
    this.lastDisplayText = '';
    this.lastContainerWidth = 0;

    this.themeManager = themeManager;
    this.typography = new TypographyManager();
    this.typography.onLayoutUpdate((glyphs) => {
      if (this.webglRenderer) {
        this.webglRenderer.render();
      }
    });

    this.displayManager = new DisplayManager({ store, themeManager });
    this.toastManager = new ToastManager();
    this.themeCoordinator = new ThemeCoordinator({ themeManager });
    this.rowManager = new RowManager({
      displayManager: this.displayManager,
      createCopySvg: (size) => this.createCopySvg(size),
      copyResult: (id, val, isMath) => this.copyResult(id, val, isMath),
      showToast: (msg) => this.toastManager.showToast(msg),
      webglRenderer: null,
      addScientificRow: (val) => this.addScientificRow(val),
    });
    this.auditTrail = new AuditTrail({
      proFormatter: this.displayManager.proFormatter,
      createCopySvg: (size) => this.createCopySvg(size),
      showToast: (msg) => this.toastManager.showToast(msg),
    });
  }

  getThemeUniforms() {
    return this.themeCoordinator.getThemeUniforms();
  }

  syncThemeColors() {
    this.themeCoordinator.syncThemeColors();
  }

  createRowInput(name, placeholder, ariaLabel) {
    return this.rowManager.createRowInput(name, placeholder, ariaLabel);
  }

  formatOperator(op) {
    return this.displayManager.formatOperator(op);
  }

  async init() {
    this.displayEl = document.getElementById('main-calc-display');
    this.previewEl = document.getElementById('main-calc-prev');
    this.auditList = document.getElementById('audit-list');
    this.memoryIndicatorEl = document.getElementById('memory-indicator');

    this.displayManager.setDisplayElements(this.displayEl, this.previewEl);
    this.auditTrail.setAuditList(this.auditList);

    await this.themeManager.init();

    layoutManager.observe(this.displayEl, 'main-calc-display');
    layoutManager.observe(this.previewEl, 'main-calc-prev');
    layoutManager.observe(this.memoryIndicatorEl, 'memory-indicator');

    const sciContainer = document.getElementById('sci-container');
    if (sciContainer) {
      layoutManager.observe(sciContainer, 'sci-container');
    }

    document.querySelectorAll('.btn, .icon-btn').forEach((btn) => {
      const id = btn.id || btn.getAttribute('aria-label') || btn.title;
      if (id) {
        layoutManager.observe(
          btn,
          `btn-${id.replace(/\s+/g, '-').toLowerCase()}`
        );
      }
    });

    document.querySelectorAll('math-field').forEach((mf, i) => {
      layoutManager.observe(mf, `math-field-${i}`);
    });

    const aboutModal = document.querySelector('.about-modal');
    if (aboutModal) {
      layoutManager.observe(aboutModal, 'about-modal');
    }
    window.layoutManager = layoutManager;

    this.webgl = new WebGLContext();
    this.webgl.canvas.setAttribute('aria-hidden', 'true');
    this.webglRenderer = new WebGLRenderer(this.webgl, this.typography);
    this.displayManager.webglRenderer = this.webglRenderer;
    this.rowManager.webglRenderer = this.webglRenderer;
    if (this.webgl.canvas) {
      document.body.prepend(this.webgl.canvas);
      document.body.classList.add('webgl-active');

      Object.assign(this.webgl.canvas.style, {
        display: 'block',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '-1',
        pointerEvents: 'none',
      });

      renderer.schedule(() => {
        this.webglRenderer.render();
      });

      if (sciContainer) {
        sciContainer.addEventListener(
          'scroll',
          () => {
            if (this.webglRenderer) this.webglRenderer.render();
          },
          { passive: true }
        );
      }

      window.addEventListener(
        'scroll',
        () => {
          if (this.webglRenderer) this.webglRenderer.render();
        },
        { passive: true }
      );
    }

    this.setupEntranceAnimations();
    this.setupResizeHandler();
    this.setupA11y();
    this.setupKeyboardShortcuts();
    this.setupPasteSupport();
    this.setupFocusHandling();
    this.themeCoordinator.setupThemePicker({
      setThemeColor: (btn, theme) =>
        this.themeCoordinator.setThemeColor(btn, theme),
      togglePaletteDropdown: (e) =>
        this.themeCoordinator.togglePaletteDropdown(e),
      toggleTheme: () => this.themeCoordinator.toggleTheme(),
    });

    initEyeTracking();
    this.themeCoordinator.syncThemeColors();

    window.uiManager = this;
  }

  getBackgroundMode(theme) {
    return this.themeCoordinator.getBackgroundMode(theme);
  }

  setupThemePicker(callbacks) {
    this.themeCoordinator.setupThemePicker(callbacks);
  }

  togglePaletteDropdown(e) {
    this.themeCoordinator.togglePaletteDropdown(e);
  }

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

  restoreState(state, callbacks = {}) {
    if (!state) return;
    this.restoreThemeAndMode(state);
    if (
      state.auditData &&
      Array.isArray(state.auditData) &&
      callbacks.addAuditEntry
    ) {
      state.auditData
        .slice()
        .reverse()
        .forEach((entry) => {
          if (
            entry.expr &&
            typeof entry.expr === 'string' &&
            typeof entry.res === 'number' &&
            isFinite(entry.res)
          ) {
            callbacks.addAuditEntry(null, null, null, entry.res, entry.expr);
          } else if (
            typeof entry.a === 'number' &&
            typeof entry.b === 'number' &&
            typeof entry.op === 'string' &&
            typeof entry.res === 'number' &&
            isFinite(entry.a) &&
            isFinite(entry.b) &&
            isFinite(entry.res)
          ) {
            callbacks.addAuditEntry(entry.a, entry.b, entry.op, entry.res);
          }
        });
    }
    this.rowManager.restorePercentageCards(state);
    this.rowManager.restoreScientificRows(state);
  }

  restoreThemeAndMode(state) {
    if (state.darkMode && !document.body.classList.contains('dark-theme'))
      this.themeCoordinator.toggleTheme();
    if (!state.darkMode && document.body.classList.contains('dark-theme'))
      this.themeCoordinator.toggleTheme();

    const checkbox = document.getElementById('checkbox');
    if (checkbox) checkbox.checked = state.darkMode;

    if (
      state.theme &&
      this.themeCoordinator.VALID_THEMES.includes(state.theme)
    ) {
      const btn = document.querySelector(
        '.theme-swatch[data-theme="' + state.theme + '"]'
      );
      if (btn) this.themeCoordinator.setThemeColor(btn, state.theme);
    }

    if (state.mode === 'scientific') {
      const isMobileDrawer = window.matchMedia('(max-width: 1024px)').matches;
      if (!isMobileDrawer) {
        this.setCalcMode('scientific');
      }
    }
  }

  restorePercentageCards(state) {
    this.rowManager.restorePercentageCards(state);
  }

  restoreScientificRows(state) {
    this.rowManager.restoreScientificRows(state);
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

  calculateRowResult(type, x, y) {
    return this.displayManager.calculateRowResult(type, x, y);
  }

  createRow(type) {
    return this.rowManager.createRow(type);
  }

  addRow(btnEl, type) {
    this.rowManager.addRow(btnEl, type);
  }

  deleteRow(btnEl) {
    this.rowManager.deleteRow(btnEl);
  }

  showToast(msg) {
    this.toastManager.showToast(msg);
  }

  showUpdateToast(onRefresh) {
    this.toastManager.showUpdateToast(onRefresh);
  }

  createCopySvg(size = 14) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    useEl.setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      './assets/sprites.svg#icon-copy'
    );
    svg.appendChild(useEl);
    return svg;
  }

  copyResult(elementId, hardcodedValue, isMathRow) {
    let textToCopy;
    if (isMathRow) {
      const el = document.getElementById(elementId);
      if (el)
        textToCopy = el.textContent
          .replace('=', '')
          .trim()
          .replace(/[%,]/g, '');
    } else if (hardcodedValue) {
      textToCopy = hardcodedValue.replace(/[%,]/g, '');
    } else {
      const el = document.getElementById(elementId);
      if (el) textToCopy = el.textContent.replace(/[%,]/g, '');
    }
    if (textToCopy) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => this.showToast('Copied to clipboard!'))
        .catch(() => this.showToast('Copy failed'));
    }
  }

  toggleDrawer() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const isClosing = sidebar.classList.contains('open');
    const isMobile = window.innerWidth <= 1024;
    void sidebar.offsetWidth;
    requestAnimationFrame(() => {
      sidebar.classList.toggle('open');
      document.body.classList.toggle('drawer-open', !isClosing);
      if (
        isClosing &&
        isMobile &&
        document.body.classList.contains('scientific-mode')
      )
        this.setCalcMode('standard');
      if (this.webglRenderer)
        renderer.schedule(() => this.webglRenderer.render());
    });
    const cleanup = (e) => {
      if (e.propertyName === 'transform' || e.propertyName === 'width') {
        if (this.webglRenderer)
          renderer.schedule(() => this.webglRenderer.render());
        sidebar.removeEventListener('transitionend', cleanup);
      }
    };
    sidebar.addEventListener('transitionend', cleanup);
  }

  toggleHistory() {
    const historyDrawer = document.getElementById('history-drawer');
    if (historyDrawer) historyDrawer.classList.toggle('open');
  }

  toggleTheme() {
    this.themeCoordinator.toggleTheme();
  }

  setThemeColor(btnEl, themeClass) {
    this.themeCoordinator.setThemeColor(btnEl, themeClass);
  }

  updateMemoryIndicator(memoryValue) {
    if (this.memoryIndicatorEl)
      this.memoryIndicatorEl.hidden = memoryValue === 0;
  }

  updateDisplay(calcState, formatOperator) {
    this.displayManager.updateDisplay(calcState, formatOperator);
  }

  addAuditEntry(
    a,
    b,
    op,
    res,
    formatOperator,
    useAuditValueCallback,
    expr = null
  ) {
    this.auditTrail.addAuditEntry(
      a,
      b,
      op,
      res,
      formatOperator,
      useAuditValueCallback,
      expr
    );
  }

  createAuditActions(res, resultFormat, useAuditValueCallback) {
    return this.auditTrail.createAuditActions(
      res,
      resultFormat,
      useAuditValueCallback
    );
  }

  clearAuditTape() {
    this.auditTrail.clearAuditTape();
  }

  setCalcMode(mode) {
    const sidebar = document.getElementById('sidebar');
    const btnStd = document.getElementById('btn-mode-std');
    const btnSci = document.getElementById('btn-mode-sci');
    const sciContainer = document.getElementById('sci-container');
    if (mode === 'scientific') {
      this.rowManager.activateScientificMode(
        sidebar,
        btnStd,
        btnSci,
        sciContainer
      );
    } else {
      const leftPanel = document.querySelector('.left-panel');
      if (leftPanel) leftPanel.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        document.body.classList.add('mode-transitioning');
        document.body.classList.remove('scientific-mode');
        if (this.typography) this.typography.glyphs = [];
        store.state.persistent.mode = mode;
        if (sciContainer) sciContainer.classList.remove('active');
        if (sidebar) sidebar.classList.remove('scientific-active');
        if (btnSci) {
          btnSci.classList.remove('active');
          btnSci.setAttribute('aria-checked', 'false');
        }
        if (btnStd) {
          btnStd.classList.add('active');
          btnStd.setAttribute('aria-checked', 'true');
        }
        const finalize = () => {
          if (leftPanel) leftPanel.style.overflow = '';
          document.body.classList.remove('mode-transitioning');
          layoutManager.refreshAll();
          if (this.webglRenderer) {
            this.webglRenderer.layoutHistory.clear();
            this.webglRenderer.render();
          }
        };
        if (leftPanel) {
          let finalized = false;
          const cleanup = (e) => {
            if (
              e &&
              (e.propertyName === 'opacity' ||
                e.propertyName === 'width' ||
                e.propertyName === 'flex-basis')
            ) {
              if (!finalized) {
                finalized = true;
                leftPanel.removeEventListener('transitionend', cleanup);
                finalize();
              }
            }
          };
          leftPanel.addEventListener('transitionend', cleanup);
          setTimeout(() => {
            if (!finalized) {
              finalized = true;
              finalize();
            }
          }, 600);
        } else {
          finalize();
        }
      });
    }
  }

  activateScientificMode(sidebar, btnStd, btnSci, sciContainer) {
    this.rowManager.activateScientificMode(
      sidebar,
      btnStd,
      btnSci,
      sciContainer
    );
  }

  addScientificRow(initialValue = '') {
    const wrapper = document.querySelector('.sci-rows-wrapper');
    if (!wrapper) return;
    const row = document.createElement('div');
    row.className = 'math-row';
    const uniqueId = 'math-res-' + crypto.randomUUID().slice(0, 8);
    layoutManager.observe(row, `math-row-${uniqueId}`);
    const mf = this.createMathField();
    if (initialValue) {
      mf.addEventListener(
        'mount',
        () => {
          mf.setValue(initialValue);
          mf.dispatchEvent(new Event('input', { bubbles: true }));
        },
        { once: true }
      );
    }
    const actionsDiv = this.createMathActions(uniqueId, row);
    row.appendChild(mf);
    row.appendChild(actionsDiv);
    row.classList.add('row-enter');
    wrapper.appendChild(row);
    void row.offsetWidth;
    requestAnimationFrame(() => {
      row.style.maxHeight = row.scrollHeight + 'px';
      row.classList.remove('row-enter');

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        row.style.maxHeight = '';
        if (this.webglRenderer) this.webglRenderer.render();
      };

      row.addEventListener(
        'transitionend',
        (e) => {
          if (e.propertyName === 'max-height') cleanup();
        },
        { once: true }
      );

      if (row.scrollHeight === 0) cleanup();

      // Safety fallback
      setTimeout(cleanup, 500);
    });
    const resEl = document.getElementById(uniqueId);
    if (resEl) this.setupMathFieldListeners(mf, resEl);
    mf.focus();
  }

  createMathField() {
    const mf = document.createElement('math-field');
    mf.setAttribute('virtual-keyboard-mode', 'manual');
    mf.addEventListener('focus', () => {
      document
        .querySelectorAll('math-field')
        .forEach((f) => f.classList.remove('last-focused'));
      mf.classList.add('last-focused');
    });
    return mf;
  }

  createMathActions(uniqueId, rowEl) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'math-actions';
    const resEl = document.createElement('span');
    resEl.className = 'math-result';
    resEl.id = uniqueId;
    resEl.textContent = '= ';
    layoutManager.observe(resEl, uniqueId);
    const copyBtn = document.createElement('button');
    copyBtn.className = 'icon-btn';
    copyBtn.appendChild(this.createCopySvg(16));
    copyBtn.addEventListener('click', () =>
      this.copyResult(uniqueId, null, true)
    );
    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn delete-row-btn';
    const delSvg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    delSvg.setAttribute('width', '16');
    delSvg.setAttribute('height', '16');
    const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    useEl.setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      './assets/sprites.svg#icon-delete'
    );
    delSvg.appendChild(useEl);
    delBtn.appendChild(delSvg);
    delBtn.addEventListener('click', () => {
      const initialHeight = rowEl.offsetHeight;
      rowEl.style.maxHeight = initialHeight + 'px';
      void rowEl.offsetWidth;
      requestAnimationFrame(() => {
        rowEl.classList.add('row-exit');
        const cleanup = () => {
          layoutManager.unobserve(rowEl);
          rowEl.remove();
          if (this.webglRenderer) this.webglRenderer.render();
        };
        rowEl.addEventListener(
          'transitionend',
          (e) => {
            if (e.propertyName === 'max-height') cleanup();
          },
          { once: true }
        );
        setTimeout(cleanup, 500);
      });
    });
    actionsDiv.appendChild(resEl);
    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(delBtn);
    return actionsDiv;
  }

  setupMathFieldListeners(mf, resEl) {
    mf.addEventListener('input', () => {
      const expr = mf.getValue('ascii-math');
      if (!expr || expr.trim() === '') {
        resEl.textContent = '= ';
        return;
      }
      if (expr.length > this.MATH_EXPR_LIMIT) {
        resEl.textContent = '= ERR: TOO LONG';
        return;
      }
      const calculated = CalculatorService.evaluate(expr);
      resEl.textContent =
        calculated !== null
          ? '= ' + this.displayManager.proFormatter.format(calculated)
          : '= ';
      if (this.webglRenderer) this.webglRenderer.render();
    });
    mf.addEventListener('change', () => {
      const expr = mf.getValue('ascii-math');
      if (expr && expr.trim() !== '') {
        const calculated = CalculatorService.evaluate(expr);
        if (calculated !== null && window.app && window.app.addAuditEntry) {
          window.app.addAuditEntry(null, null, null, calculated, true, expr);
        }
      }
    });
  }
}

export const uiManager = new UIManager();
