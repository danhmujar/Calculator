// ui/ui.js

/**
 * AboutModal - Manages the "About" dialog with focus trap and ARIA support.
 */
class AboutModal {
  constructor() {
    this.FOCUS_DELAY_MS = 50;
    this.overlay = document.getElementById('about-overlay');
    if (!this.overlay) return;

    this.modal = this.overlay.querySelector('.about-modal');
    this.fabBtn = document.getElementById('about-fab-btn');
    this.closeX = document.getElementById('about-close-x');
    this.previouslyFocused = null;

    this.init();
  }

  init() {
    if (!this.modal || !this.fabBtn || !this.closeX) return;

    this.fabBtn.addEventListener('click', () => this.open());
    this.closeX.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.modal.addEventListener('keydown', (e) => this.handleTab(e));
  }

  getFocusableElements() {
    return this.modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }

  open() {
    this.previouslyFocused = document.activeElement;
    this.overlay.classList.add('open');
    this.overlay.setAttribute('aria-hidden', 'false');
    this.modal.setAttribute('aria-labelledby', 'about-heading');
    document.body.style.overflow = 'hidden';

    document
      .querySelectorAll('.layout-container, .mobile-panel-fab, .about-fab')
      .forEach((el) => {
        el.setAttribute('inert', '');
      });

    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('open')) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
    setTimeout(() => this.closeX.focus(), this.FOCUS_DELAY_MS);
    this.displayVersion();
  }

  close() {
    this.overlay.classList.remove('open');
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    document
      .querySelectorAll('.layout-container, .mobile-panel-fab, .about-fab')
      .forEach((el) => {
        el.removeAttribute('inert');
      });

    document.removeEventListener('keydown', this.escapeHandler);
    if (this.previouslyFocused && this.previouslyFocused.focus) {
      this.previouslyFocused.focus();
    }
  }

  handleTab(e) {
    if (e.key !== 'Tab') return;
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  async displayVersion() {
    const versionElement = document.getElementById('version-number');
    if (!versionElement) return;

    try {
      const response = await fetch('./version.json?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to fetch version');
      const data = await response.json();
      versionElement.textContent = data.version;
    } catch (error) {
      console.error('Failed to load version:', error);
      versionElement.textContent = 'Unknown';
    }
  }
}

/**
 * ChangelogModal - Manages the "Changelog" dialog shown once on update.
 */
class ChangelogModal {
  constructor() {
    this.FOCUS_DELAY_MS = 50;
    this.overlay = document.getElementById('changelog-overlay');
    if (!this.overlay) return;

    this.modal = this.overlay.querySelector('.about-modal');
    this.closeX = document.getElementById('changelog-close-x');
    this.okBtn = document.getElementById('changelog-ok-btn');
    this.previouslyFocused = null;
    this.currentVersion = null;

    this.init();
  }

  init() {
    if (!this.modal || !this.closeX || !this.okBtn) return;

    this.closeX.addEventListener('click', () => this.close());
    this.okBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.modal.addEventListener('keydown', (e) => this.handleTab(e));

    this.checkChangelog();
  }

  getFocusableElements() {
    return this.modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }

  async checkChangelog() {
    try {
      const response = await fetch('./changelog.json?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to fetch changelog');
      const data = await response.json();
      this.currentVersion = data.version;

      const lastSeen = localStorage.getItem('lastSeenChangelogVersion');
      const hasExistingState =
        localStorage.getItem('interactiveCalcState') !== null;

      if (lastSeen === null) {
        if (hasExistingState) {
          // Returning user updating from 1.0! Show them the changelog.
          this.renderChangelog(data);
          this.open();
        } else {
          // Brand new visitor! Silently initialize.
          localStorage.setItem('lastSeenChangelogVersion', data.version);
        }
      } else if (data.version !== lastSeen) {
        this.renderChangelog(data);
        this.open();
      }
    } catch (error) {
      console.error('Failed to load changelog:', error);
    }
  }

  renderChangelog(data) {
    const headingEl = document.getElementById('changelog-heading');
    if (headingEl) {
      headingEl.textContent = "What's New in v" + data.version;
    }

    const contentEl = document.getElementById('changelog-content');
    if (!contentEl) return;

    contentEl.textContent = '';

    if (data.features && data.features.length > 0) {
      const featuresTitle = document.createElement('h3');
      featuresTitle.className = 'changelog-section-title';
      featuresTitle.textContent = 'Features';
      contentEl.appendChild(featuresTitle);

      const featuresList = document.createElement('ul');
      data.features.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        featuresList.appendChild(li);
      });
      contentEl.appendChild(featuresList);
    }

    if (data.improvements && data.improvements.length > 0) {
      const improvementsTitle = document.createElement('h3');
      improvementsTitle.className = 'changelog-section-title';
      improvementsTitle.textContent = 'Improvements';
      contentEl.appendChild(improvementsTitle);

      const improvementsList = document.createElement('ul');
      data.improvements.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        improvementsList.appendChild(li);
      });
      contentEl.appendChild(improvementsList);
    }

    if (data.fixes && data.fixes.length > 0) {
      const fixesTitle = document.createElement('h3');
      fixesTitle.className = 'changelog-section-title';
      fixesTitle.textContent = 'Fixes';
      contentEl.appendChild(fixesTitle);

      const fixesList = document.createElement('ul');
      data.fixes.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        fixesList.appendChild(li);
      });
      contentEl.appendChild(fixesList);
    }
  }

  open() {
    this.previouslyFocused = document.activeElement;
    this.overlay.classList.add('open');
    this.overlay.setAttribute('aria-hidden', 'false');
    this.modal.setAttribute('aria-labelledby', 'changelog-heading');
    document.body.style.overflow = 'hidden';

    document
      .querySelectorAll('.layout-container, .mobile-panel-fab, .about-fab')
      .forEach((el) => {
        el.setAttribute('inert', '');
      });

    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('open')) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
    setTimeout(() => this.closeX.focus(), this.FOCUS_DELAY_MS);
  }

  close() {
    this.overlay.classList.remove('open');
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    document
      .querySelectorAll('.layout-container, .mobile-panel-fab, .about-fab')
      .forEach((el) => {
        el.removeAttribute('inert');
      });

    document.removeEventListener('keydown', this.escapeHandler);
    if (this.previouslyFocused && this.previouslyFocused.focus) {
      this.previouslyFocused.focus();
    }

    if (this.currentVersion) {
      localStorage.setItem('lastSeenChangelogVersion', this.currentVersion);
    }
  }

  handleTab(e) {
    if (e.key !== 'Tab') return;
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

/**
 * SidebarResizer - Handles draggable resizing of the sidebar.
 */
class SidebarResizer {
  constructor() {
    this.resizer = document.getElementById('panel-resizer');
    this.sidebar = document.getElementById('sidebar');
    if (!this.resizer || !this.sidebar) return;

    this.isResizing = false;
    this.init();
  }

  init() {
    const savedWidth = localStorage.getItem('calcSidebarWidth');
    if (savedWidth) {
      document.documentElement.style.setProperty(
        '--sidebar-width',
        savedWidth + 'px'
      );
    }

    this.resizer.addEventListener('pointerdown', (e) => this.startResize(e));
    document.addEventListener('pointermove', (e) => this.resize(e));
    document.addEventListener('pointerup', (e) => this.stopResize(e));
  }

  startResize(e) {
    this.isResizing = true;
    this.resizer.classList.add('active');
    document.body.classList.add('is-resizing');
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
    this.resizer.setPointerCapture(e.pointerId);
  }

  resize(e) {
    if (!this.isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    // Constraint check: 250px - 80% of window
    const clampedWidth = Math.max(
      250,
      Math.min(newWidth, window.innerWidth * 0.8)
    );
    document.documentElement.style.setProperty(
      '--sidebar-width',
      clampedWidth + 'px'
    );
    this.resizer.setAttribute('aria-valuenow', Math.round(clampedWidth));
  }

  stopResize(e) {
    if (!this.isResizing) return;
    this.isResizing = false;
    this.resizer.classList.remove('active');
    document.body.classList.remove('is-resizing');
    document.body.style.cursor = '';
    this.resizer.releasePointerCapture(e.pointerId);

    const finalWidth = this.sidebar.getBoundingClientRect().width;
    localStorage.setItem('calcSidebarWidth', finalWidth);
  }
}

// Initialize UI components on load
window.addEventListener('DOMContentLoaded', () => {
  new AboutModal();
  new SidebarResizer();
  new ChangelogModal();
});
