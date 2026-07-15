import { layoutManager } from '../services/core/layout.js';
import { CalculatorService } from '../services/math/calculator.ts';

export class MathFieldController {
  constructor({ displayManager, getClipboardManager, getWebglRenderer }) {
    this.displayManager = displayManager;
    this.getClipboardManager = getClipboardManager;
    this.getWebglRenderer = getWebglRenderer;
    this.MATH_EXPR_LIMIT = 1000;
  }

  get clipboardManager() {
    return this.getClipboardManager();
  }

  get webglRenderer() {
    return this.getWebglRenderer();
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
    const nameWrapper = document.createElement('div');
    nameWrapper.className = 'row-name-wrapper';

    const nameDisplay = document.createElement('span');
    nameDisplay.className = 'row-name-display is-placeholder';
    nameDisplay.setAttribute('role', 'button');
    nameDisplay.setAttribute('tabindex', '0');
    nameDisplay.setAttribute('aria-label', 'Edit row name');
    nameDisplay.textContent = 'Name this row...';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'row-name-input';
    nameInput.maxLength = 30;
    nameInput.placeholder = 'Name this row...';
    nameInput.setAttribute('aria-label', 'Row name');
    nameInput.hidden = true;

    nameWrapper.appendChild(nameDisplay);
    nameWrapper.appendChild(nameInput);

    const enterEditMode = () => {
      nameWrapper.classList.add('editing');
      nameDisplay.hidden = true;
      nameInput.hidden = false;
      const currentName =
        nameDisplay.textContent === 'Name this row...'
          ? ''
          : nameDisplay.textContent;
      nameInput.value = currentName;
      nameInput.focus();
    };

    const exitEditMode = (save) => {
      nameWrapper.classList.remove('editing');
      if (save) {
        const value = nameInput.value.trim();
        if (value) {
          nameDisplay.textContent = value;
          nameDisplay.classList.remove('is-placeholder');
        } else {
          nameDisplay.textContent = 'Name this row...';
          nameDisplay.classList.add('is-placeholder');
        }
      }
      nameInput.hidden = true;
      nameDisplay.hidden = false;
    };

    nameDisplay.addEventListener('click', enterEditMode);
    nameDisplay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        enterEditMode();
      }
    });

    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameInput.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        exitEditMode(false);
      }
    });

    nameInput.addEventListener('blur', () => {
      if (!nameInput.hidden) {
        exitEditMode(true);
      }
    });

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'math-input-wrapper';
    inputWrapper.appendChild(nameWrapper);
    inputWrapper.appendChild(mf);

    const actionsDiv = this.createMathActions(uniqueId, row);
    row.appendChild(inputWrapper);
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
    copyBtn.appendChild(this.clipboardManager.createCopySvg(16));
    copyBtn.addEventListener('click', () =>
      this.clipboardManager.copyResult(uniqueId, null, true)
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
