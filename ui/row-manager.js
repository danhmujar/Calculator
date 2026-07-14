import { store } from '../services/core/store.js';
import { layoutManager } from '../services/core/layout.js';

export class RowManager {
  constructor({
    displayManager,
    createCopySvg,
    copyResult,
    showToast,
    webglRenderer,
    addScientificRow,
  }) {
    this.displayManager = displayManager;
    this.createCopySvg = createCopySvg;
    this.copyResult = copyResult;
    this.showToast = showToast;
    this.webglRenderer = webglRenderer;
    this.addScientificRow = addScientificRow;

    this.VALID_CARD_TYPES = ['type1', 'type2', 'type3', 'type4'];
    this._pendingSciRows = null;

    this.ROW_BUILDERS = {
      type1: (parent) => {
        const group = document.createElement('div');
        group.className = 'input-group';
        const x = this.createRowInput('val-x', 'X', 'First value');
        const span = document.createElement('span');
        span.textContent = 'is what % of';
        const y = this.createRowInput('val-y', 'Y', 'Second value');
        group.append(x, ' ', span, ' ', y);
        parent.appendChild(group);
      },
      type2: (parent) => {
        const group = document.createElement('div');
        group.className = 'input-group';
        const span1 = document.createElement('span');
        span1.textContent = 'What is';
        const x = this.createRowInput('val-x', 'X %', 'Percentage');
        const span2 = document.createElement('span');
        span2.textContent = '% of';
        const y = this.createRowInput('val-y', 'Y', 'Value');
        group.append(span1, ' ', x, ' ', span2, ' ', y);
        parent.appendChild(group);
      },
      type3: (parent) => {
        const group = document.createElement('div');
        group.className = 'input-group';
        const span1 = document.createElement('span');
        span1.textContent = 'Change from';
        const x = this.createRowInput('val-x', 'X', 'Original value');
        const span2 = document.createElement('span');
        span2.textContent = 'to';
        const y = this.createRowInput('val-y', 'Y', 'New value');
        group.append(span1, ' ', x, ' ', span2, ' ', y);
        parent.appendChild(group);
      },
      type4: (parent) => {
        const group = document.createElement('div');
        group.className = 'input-group';
        const x = this.createRowInput('val-x', 'X', 'Partial value');
        const span1 = document.createElement('span');
        span1.textContent = 'is';
        const y = this.createRowInput('val-y', 'P %', 'Percentage');
        const span2 = document.createElement('span');
        span2.textContent = '% of what?';
        group.append(x, ' ', span1, ' ', y, ' ', span2);
        parent.appendChild(group);
      },
    };
  }

  createRowInput(name, placeholder, ariaLabel) {
    const input = document.createElement('input');
    input.type = 'number';
    input.name = name;
    input.className = name;
    input.placeholder = placeholder;
    input.step = 'any';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', ariaLabel);
    return input;
  }

  createRow(type) {
    const container = document.createElement('div');
    container.className = 'calc-row-instance';
    const uniqueId = 'res-' + crypto.randomUUID().slice(0, 8);
    layoutManager.observe(container, `row-${uniqueId}`);
    const templateContainer = document.createElement('div');
    templateContainer.className = 'row-template-content';
    if (this.ROW_BUILDERS[type]) this.ROW_BUILDERS[type](templateContainer);
    container.appendChild(templateContainer);
    const resultGroup = document.createElement('div');
    resultGroup.className = 'result-group';
    const resultLabel = document.createElement('span');
    resultLabel.textContent = 'Result:';
    resultGroup.appendChild(resultLabel);
    const resultValue = document.createElement('span');
    resultValue.className = 'result-value';
    resultValue.id = uniqueId;
    resultValue.setAttribute('aria-live', 'polite');
    resultValue.textContent =
      type === 'type1' || type === 'type3' ? '0.00%' : '0.00';
    resultGroup.appendChild(resultValue);
    const copyBtn = document.createElement('button');
    copyBtn.className = 'icon-btn copy-row-btn';
    copyBtn.title = 'Copy result';
    copyBtn.appendChild(this.createCopySvg(18));
    resultGroup.appendChild(copyBtn);
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn delete-row-btn';
    deleteBtn.title = 'Delete Row';
    const deleteSvg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    deleteSvg.setAttribute('width', '18');
    deleteSvg.setAttribute('height', '18');
    const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    useEl.setAttributeNS(
      'http://www.w3.org/1999/xlink',
      'xlink:href',
      './assets/sprites.svg#icon-delete'
    );
    deleteSvg.appendChild(useEl);
    deleteBtn.appendChild(deleteSvg);
    resultGroup.appendChild(deleteBtn);
    container.appendChild(resultGroup);
    copyBtn.addEventListener('click', () => this.copyResult(uniqueId));
    deleteBtn.addEventListener('click', () => this.deleteRow(deleteBtn));
    const xInput = container.querySelector('.val-x');
    const yInput = container.querySelector('.val-y');
    const updater = () => {
      const xVal = parseFloat(xInput.value);
      const yVal = parseFloat(yInput.value);
      const newResult = this.displayManager.calculateRowResult(
        type,
        isNaN(xVal) ? null : xVal,
        isNaN(yVal) ? null : yVal
      );

      if (resultValue.textContent !== newResult) {
        resultValue.textContent = newResult;
        resultValue.classList.remove('result-updated');
        void resultValue.offsetWidth;
        resultValue.classList.add('result-updated');
      }
    };
    xInput.addEventListener('input', updater);
    yInput.addEventListener('input', updater);
    return container;
  }

  addRow(btnEl, type) {
    const container = btnEl
      .closest('.calc-card')
      .querySelector('.calc-rows-container');
    const newRow = this.createRow(type);
    newRow.classList.add('row-enter');
    container.appendChild(newRow);
    void newRow.offsetWidth;
    requestAnimationFrame(() => {
      newRow.style.maxHeight = newRow.scrollHeight + 'px';
      newRow.classList.remove('row-enter');

      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        newRow.style.maxHeight = '';
        if (this.webglRenderer) this.webglRenderer.render();
      };

      newRow.addEventListener(
        'transitionend',
        (e) => {
          if (e.propertyName === 'max-height') cleanup();
        },
        { once: true }
      );

      setTimeout(cleanup, 500);
    });
  }

  deleteRow(btnEl) {
    const rowInstance = btnEl.closest('.calc-row-instance');
    if (!rowInstance) return;

    const initialHeight = rowInstance.offsetHeight;
    rowInstance.style.maxHeight = initialHeight + 'px';

    void rowInstance.offsetHeight;

    requestAnimationFrame(() => {
      rowInstance.classList.add('row-exit');
      const cleanup = () => {
        layoutManager.unobserve(rowInstance);
        rowInstance.remove();
        if (this.webglRenderer) this.webglRenderer.render();
      };

      rowInstance.addEventListener(
        'transitionend',
        (e) => {
          if (e.propertyName === 'max-height') cleanup();
        },
        { once: true }
      );

      setTimeout(cleanup, 500);
    });
  }

  restorePercentageCards(state) {
    this.VALID_CARD_TYPES.forEach((type) => {
      const card = document.querySelector(`.calc-card[data-type="${type}"]`);
      if (card) {
        const container = card.querySelector('.calc-rows-container');
        if (!container) return;

        container.replaceChildren();
        const rows = (state.cards && state.cards[type]) || [];
        if (rows.length === 0) {
          container.appendChild(this.createRow(type));
        } else {
          rows.forEach((rowData) => {
            const newRow = this.createRow(type);
            const x = newRow.querySelector('.val-x');
            const y = newRow.querySelector('.val-y');
            if (x && y) {
              x.value = rowData.x || '';
              y.value = rowData.y || '';
              container.appendChild(newRow);
              x.dispatchEvent(new Event('input'));
            }
          });
        }
      }
    });
  }

  restoreScientificRows(state) {
    if (state.sciRows && state.sciRows.length > 0) {
      this._pendingSciRows = state.sciRows;
      if (window.customElements.get('math-field')) {
        const sciWrapper = document.querySelector('.sci-rows-wrapper');
        if (sciWrapper) {
          sciWrapper.replaceChildren();
          this._pendingSciRows.forEach((val) => this.addScientificRow(val));
          this._pendingSciRows = null;
        }
      }
    }
  }

  async activateScientificMode(sidebar, btnStd, btnSci, sciContainer) {
    const leftPanel = document.querySelector('.left-panel');
    if (leftPanel) leftPanel.style.overflow = 'hidden';
    if (!window.customElements.get('math-field')) {
      this.showToast('Loading Scientific Engine...');
      try {
        const ml = await import('mathlive');
        if (ml && ml.MathfieldElement)
          ml.MathfieldElement.fontsDirectory = '/Calculator/fonts/';
        await customElements.whenDefined('math-field');
      } catch (err) {
        this.showToast('Error loading scientific engine');
        return;
      }
    }
    requestAnimationFrame(() => {
      document.body.classList.add('mode-transitioning');
      document.body.classList.add('scientific-mode');
      store.state.persistent.mode = 'scientific';
      if (sidebar) sidebar.classList.add('scientific-active');
      if (btnStd) {
        btnStd.classList.remove('active');
        btnStd.setAttribute('aria-checked', 'false');
      }
      if (btnSci) {
        btnSci.classList.add('active');
        btnSci.setAttribute('aria-checked', 'true');
      }
      if (sciContainer) sciContainer.classList.add('active');
      const wrapper = document.querySelector('.sci-rows-wrapper');
      if (wrapper) {
        if (this._pendingSciRows) {
          wrapper.replaceChildren();
          this._pendingSciRows.forEach((val) => this.addScientificRow(val));
          this._pendingSciRows = null;
        } else if (wrapper.children.length === 0) {
          this.addScientificRow();
        }
      }
    });
    if (sidebar) {
      let finalized = false;
      const cleanup = (e) => {
        if (e.propertyName === 'transform' || e.propertyName === 'width') {
          if (!finalized) {
            finalized = true;
            sidebar.removeEventListener('transitionend', cleanup);
            document.body.classList.remove('mode-transitioning');
            layoutManager.refreshAll();
            if (this.webglRenderer) {
              this.webglRenderer.layoutHistory.clear();
              this.webglRenderer.render();
            }
          }
        }
      };
      sidebar.addEventListener('transitionend', cleanup);
      setTimeout(() => {
        if (!finalized) {
          finalized = true;
          document.body.classList.remove('mode-transitioning');
          layoutManager.refreshAll();
        }
      }, 600);
    }
  }
}
