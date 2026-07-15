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
}
