import { store } from '../services/core/store.js';
import { layoutManager } from '../services/core/layout.js';
import { renderer } from './renderer.js';

export class InteractionController {
  constructor({ rowManager, getTypography, getWebglRenderer }) {
    this.rowManager = rowManager;
    this.getTypography = getTypography;
    this.getWebglRenderer = getWebglRenderer;
  }

  get typography() {
    return this.getTypography();
  }

  get webglRenderer() {
    return this.getWebglRenderer();
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
}
