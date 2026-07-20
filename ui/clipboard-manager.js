export class ClipboardManager {
  constructor({ showToast }) {
    this.showToast = showToast;
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

  copyExcelFormula(mf) {
    if (!mf) return;
    const expr = mf.getValue('ascii-math');
    if (!expr || expr.trim() === '') {
      this.showToast('Formula is empty!');
      return;
    }

    const excelFormula = this.translateToExcelFormula(expr);
    navigator.clipboard
      .writeText(excelFormula)
      .then(() => this.showToast('Excel formula copied!'))
      .catch(() => this.showToast('Copy failed'));
  }

  translateToExcelFormula(expr) {
    if (!expr) return '';
    let excel = expr.trim();

    // 1. Function Uppercasing
    const standardFunctions = [
      'sin',
      'cos',
      'tan',
      'asin',
      'acos',
      'atan',
      'sqrt',
      'log',
      'ln',
      'abs',
    ];
    standardFunctions.forEach((fn) => {
      const regex = new RegExp(`\\b${fn}\\(`, 'gi');
      excel = excel.replace(regex, `${fn.toUpperCase()}(`);
    });

    // 2. Constants Mapping
    excel = excel.replace(/\bpi\b/gi, 'PI()');
    excel = excel.replace(/\be\b/gi, 'EXP(1)');

    // 3. Formula Equation Prefix
    if (!excel.startsWith('=')) {
      excel = '=' + excel;
    }
    return excel;
  }
}
