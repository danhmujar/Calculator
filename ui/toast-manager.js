export class ToastManager {
  constructor() {
    this.TOAST_DURATION_MS = 2000;
    this.toastTimeout = null;
    this.refreshHandler = null;
    this.dismissHandler = null;
  }

  showToast(msg = 'Copied to clipboard!') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    clearTimeout(this.toastTimeout);
    toast.textContent = msg;
    toast.classList.add('show');
    this.toastTimeout = setTimeout(
      () => toast.classList.remove('show'),
      this.TOAST_DURATION_MS
    );
  }

  showUpdateToast(onRefresh) {
    const toast = document.getElementById('update-toast');
    if (!toast) return;

    toast.hidden = false;

    const refreshBtn = document.getElementById('update-refresh-btn');
    if (refreshBtn) {
      if (this.refreshHandler) {
        refreshBtn.removeEventListener('click', this.refreshHandler);
      }
      this.refreshHandler = () => {
        if (typeof onRefresh === 'function') {
          onRefresh();
        }
      };
      refreshBtn.addEventListener('click', this.refreshHandler);
    }

    const dismissBtn = document.getElementById('update-dismiss-btn');
    if (dismissBtn) {
      if (this.dismissHandler) {
        dismissBtn.removeEventListener('click', this.dismissHandler);
      }
      this.dismissHandler = () => {
        toast.hidden = true;
      };
      dismissBtn.addEventListener('click', this.dismissHandler);
    }
  }
}
