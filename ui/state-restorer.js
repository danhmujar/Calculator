export class StateRestorer {
  constructor({ rowManager, themeCoordinator, setCalcMode }) {
    this.rowManager = rowManager;
    this.themeCoordinator = themeCoordinator;
    this.setCalcMode = setCalcMode;
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
}
