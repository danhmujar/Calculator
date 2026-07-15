import { CalculatorService } from '../services/math/calculator.ts';
import { renderer } from './renderer.js';

export class DisplayManager {
  constructor({ store, themeManager, webglRenderer } = {}) {
    this.store = store;
    this.themeManager = themeManager;
    this.webglRenderer = webglRenderer;
    this.proFormatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
    this.displayEl = null;
    this.previewEl = null;
    this.memoryIndicatorEl = null;
  }

  setDisplayElements(displayEl, previewEl, memoryIndicatorEl) {
    this.displayEl = displayEl;
    this.previewEl = previewEl;
    this.memoryIndicatorEl = memoryIndicatorEl;
  }

  updateMemoryIndicator(memoryValue) {
    if (this.memoryIndicatorEl)
      this.memoryIndicatorEl.hidden = memoryValue === 0;
  }

  formatOperator(op) {
    switch (op) {
      case '*':
        return '×';
      case '/':
        return '÷';
      case '-':
        return '−';
      default:
        return op;
    }
  }

  calculateRowResult(type, x, y) {
    const result = CalculatorService.calculatePercentage(type, x, y);
    if (result === null) {
      return type === 'type1' || type === 'type3' ? '0.00%' : '0.00';
    }
    if (result === 'Error') {
      return 'Error';
    }
    if (type === 'type1') {
      return this.proFormatter.format(result) + '%';
    }
    if (type === 'type3') {
      return (result > 0 ? '+' : '') + this.proFormatter.format(result) + '%';
    }
    return this.proFormatter.format(result);
  }

  updateDisplay(calcState, formatOperatorFn) {
    renderer.schedule(() => {
      if (!this.displayEl || !this.previewEl) {
        return;
      }
      let hasDot = calcState.currentValue.endsWith('.');
      let targetVal = parseFloat(calcState.currentValue);
      if (isNaN(targetVal)) {
        targetVal = 0;
      }
      let formatted = this.proFormatter.format(targetVal);
      if (hasDot) {
        formatted += '.';
      }
      if (formatted.length > 15 && targetVal > 0) {
        formatted = targetVal.toExponential(4);
      }
      const valueEl =
        this.displayEl.querySelector('.display-value') || this.displayEl;
      valueEl.textContent = formatted;
      if (calcState.previousValue !== null && calcState.operator) {
        this.previewEl.textContent = `${this.proFormatter.format(calcState.previousValue)} ${formatOperatorFn(calcState.operator)}`;
      } else {
        this.previewEl.textContent = '';
      }
      if (this.webglRenderer) {
        this.webglRenderer.render();
      }
    });
  }
}
