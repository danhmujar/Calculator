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
import { ClipboardManager } from './clipboard-manager.js';
import { DOMInitializer } from './dom-initializer.js';
import { InteractionController } from './interaction-controller.js';
import { MathFieldController } from './math-field-controller.js';
import { StateRestorer } from './state-restorer.js';

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
    this.clipboardManager = new ClipboardManager({
      showToast: (msg) => this.toastManager.showToast(msg),
    });
    this.mathFieldController = new MathFieldController({
      displayManager: this.displayManager,
      getClipboardManager: () => this.clipboardManager,
      getWebglRenderer: () => this.webglRenderer,
    });
    this.themeCoordinator = new ThemeCoordinator({ themeManager });
    this.rowManager = new RowManager({
      displayManager: this.displayManager,
      createCopySvg: (size) => this.clipboardManager.createCopySvg(size),
      copyResult: (id, val, isMath) =>
        this.clipboardManager.copyResult(id, val, isMath),
      showToast: (msg) => this.toastManager.showToast(msg),
      webglRenderer: null,
      addScientificRow: (val) => this.mathFieldController.addScientificRow(val),
    });
    this.auditTrail = new AuditTrail({
      proFormatter: this.displayManager.proFormatter,
      createCopySvg: (size) => this.clipboardManager.createCopySvg(size),
      showToast: (msg) => this.toastManager.showToast(msg),
    });
    this.interactionController = new InteractionController({
      rowManager: this.rowManager,
      getTypography: () => this.typography,
      getWebglRenderer: () => this.webglRenderer,
    });
    this.stateRestorer = new StateRestorer({
      rowManager: this.rowManager,
      themeCoordinator: this.themeCoordinator,
      setCalcMode: (mode) => this.setCalcMode(mode),
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

    this.displayManager.setDisplayElements(
      this.displayEl,
      this.previewEl,
      this.memoryIndicatorEl
    );
    this.auditTrail.setAuditList(this.auditList);

    const copyBtn = document.getElementById('display-copy-btn');
    if (copyBtn) {
      copyBtn.appendChild(this.clipboardManager.createCopySvg(14));
      copyBtn.addEventListener('click', () => {
        this.clipboardManager.copyResult('main-display-value');
      });
    }

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

    this.domInitializer = new DOMInitializer(
      () => this.webgl,
      () => this.webglRenderer
    );
    this.domInitializer.init();
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

  restoreState(state, callbacks = {}) {
    this.stateRestorer.restoreState(state, callbacks);
  }

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

  toggleDrawer() {
    this.interactionController.toggleDrawer();
  }

  toggleHistory() {
    this.interactionController.toggleHistory();
  }

  toggleTheme() {
    this.themeCoordinator.toggleTheme();
  }

  setThemeColor(btnEl, themeClass) {
    this.themeCoordinator.setThemeColor(btnEl, themeClass);
  }

  updateMemoryIndicator(memoryValue) {
    this.displayManager.updateMemoryIndicator(memoryValue);
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
    this.interactionController.setCalcMode(mode);
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
    this.mathFieldController.addScientificRow(initialValue);
  }
}

export const uiManager = new UIManager();
