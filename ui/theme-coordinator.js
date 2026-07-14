import { store } from '../services/core/store.js';
import { renderer } from './renderer.js';

export class ThemeCoordinator {
  constructor({ themeManager, webglRenderer }) {
    this.themeManager = themeManager;
    this.webglRenderer = webglRenderer;
    this.VALID_THEMES = [
      'theme-teal',
      'theme-terracotta',
      'theme-forest',
      'theme-slate',
      'theme-rosewood',
      'theme-pistachio',
      'theme-purple',
      'theme-aurora',
      'theme-aurora-ocean',
      'theme-aurora-cyber',
      'theme-aurora-sunset',
      'theme-bts',
      '',
    ];
  }

  getThemeUniforms() {
    return this.themeManager.getInterpolatedTheme(performance.now());
  }

  syncThemeColors() {
    this.themeManager.updateTargetTheme();
    if (this.webglRenderer) {
      renderer.schedule(() => this.webglRenderer.render());
    }
  }

  getBackgroundMode(theme) {
    if (!theme) return 0;
    if (theme === 'theme-bts') return 2;
    if (theme.includes('theme-aurora')) return 1;
    return 0;
  }

  setupThemePicker() {
    const picker = document.querySelector('.theme-picker');
    if (picker) {
      picker.addEventListener('click', (e) => {
        const swatch = e.target.closest('.theme-swatch');
        if (!swatch) return;
        this.setThemeColor(swatch, swatch.getAttribute('data-theme'));
      });
    }

    const paletteBtn = document.getElementById('palette-toggle-btn');
    if (paletteBtn) {
      paletteBtn.addEventListener('click', (e) => {
        this.togglePaletteDropdown(e);
      });
    }

    const themeCheckbox = document.getElementById('checkbox');
    if (themeCheckbox) {
      themeCheckbox.addEventListener('change', () => this.toggleTheme());
    }

    document.addEventListener('click', (event) => {
      const dropdown = document.getElementById('theme-dropdown-container');
      if (
        dropdown &&
        dropdown.classList.contains('active') &&
        !dropdown.contains(event.target)
      ) {
        dropdown.classList.remove('active');
      }
    });
  }

  togglePaletteDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('theme-dropdown-container');
    if (dropdown) dropdown.classList.toggle('active');
  }

  toggleTheme() {
    const body = document.body;
    const isAurora = Array.from(body.classList).some((c) =>
      c.startsWith('theme-aurora')
    );
    const isBTS = body.classList.contains('theme-bts');
    if ((isAurora || isBTS) && body.classList.contains('dark-theme')) {
      body.classList.remove(
        'theme-aurora',
        'theme-aurora-ocean',
        'theme-aurora-cyber',
        'theme-aurora-sunset',
        'theme-bts'
      );
      const picker = document.querySelector('.theme-picker');
      if (picker) {
        picker
          .querySelectorAll('.theme-swatch')
          .forEach((btn) => btn.classList.remove('active'));
        const defaultSwatch = picker.querySelector(
          '.theme-swatch[data-theme=""]'
        );
        if (defaultSwatch) defaultSwatch.classList.add('active');
      }
      store.state.persistent.theme = '';
    }
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    store.state.persistent.darkMode = isDark;

    const checkbox = document.getElementById('checkbox');
    if (checkbox) checkbox.checked = body.classList.contains('dark-theme');
    this.syncThemeColors();
  }

  setThemeColor(btnEl, themeClass) {
    if (themeClass && !this.VALID_THEMES.includes(themeClass)) return;
    const picker = document.querySelector('.theme-picker');
    if (picker) {
      picker.querySelectorAll('.theme-swatch').forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
      });
    }
    btnEl.classList.add('active');
    btnEl.setAttribute('aria-checked', 'true');
    document.body.classList.remove(
      'theme-teal',
      'theme-terracotta',
      'theme-forest',
      'theme-slate',
      'theme-rosewood',
      'theme-pistachio',
      'theme-purple',
      'theme-aurora',
      'theme-aurora-ocean',
      'theme-aurora-cyber',
      'theme-aurora-sunset',
      'theme-bts'
    );
    if (themeClass) {
      document.body.classList.add(themeClass);
      store.state.persistent.theme = themeClass;

      if (themeClass.startsWith('theme-aurora') || themeClass === 'theme-bts') {
        document.body.classList.add('dark-theme');
        store.state.persistent.darkMode = true;
        const checkbox = document.getElementById('checkbox');
        if (checkbox) checkbox.checked = true;
      }
    } else {
      store.state.persistent.theme = '';
    }
    const dropdown = document.getElementById('theme-dropdown-container');
    if (dropdown) dropdown.classList.remove('active');
    this.syncThemeColors();
  }
}
