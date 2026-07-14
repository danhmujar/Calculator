export class AuditTrail {
  constructor({ proFormatter, createCopySvg, showToast }) {
    this.proFormatter = proFormatter;
    this.createCopySvg = createCopySvg;
    this.showToast = showToast;
    this.auditList = null;
  }

  setAuditList(el) {
    this.auditList = el;
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
    let equation =
      expr ||
      this.proFormatter.format(a) +
        ' ' +
        formatOperator(op) +
        ' ' +
        this.proFormatter.format(b);
    const resultFormat = this.proFormatter.format(res);
    const li = document.createElement('li');
    li.className = 'audit-item';
    const eqDiv = document.createElement('div');
    eqDiv.className = 'audit-equation';
    eqDiv.textContent = equation + ' =';
    const resultRow = document.createElement('div');
    resultRow.className = 'audit-result-row';
    const actionsDiv = this.createAuditActions(
      res,
      resultFormat,
      useAuditValueCallback
    );
    const resDiv = document.createElement('div');
    resDiv.className = 'audit-result';
    resDiv.textContent = resultFormat;
    resultRow.appendChild(actionsDiv);
    resultRow.appendChild(resDiv);
    li.appendChild(eqDiv);
    li.appendChild(resultRow);
    if (this.auditList) this.auditList.prepend(li);
  }

  createAuditActions(res, resultFormat, useAuditValueCallback) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'audit-actions';
    const useBtn = document.createElement('button');
    useBtn.className = 'btn-use';
    useBtn.textContent = 'Use';
    useBtn.addEventListener('click', () => useAuditValueCallback(res));
    const copyBtn = document.createElement('button');
    copyBtn.className = 'icon-btn';
    copyBtn.title = 'Copy';
    copyBtn.appendChild(this.createCopySvg(14));
    copyBtn.addEventListener('click', () => {
      const rawValue = resultFormat.replace(/[%,]/g, '');
      if (rawValue)
        navigator.clipboard
          .writeText(rawValue)
          .then(() => this.showToast('Copied to clipboard!'))
          .catch(() => this.showToast('Copy failed'));
    });
    actionsDiv.appendChild(useBtn);
    actionsDiv.appendChild(copyBtn);
    return actionsDiv;
  }

  clearAuditTape() {
    if (this.auditList) this.auditList.textContent = '';
  }
}
