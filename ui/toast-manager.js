export class ToastManager {
  constructor() {
    this.TOAST_DURATION_MS = 2000;
    this.toastTimeout = null;
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
      refreshBtn.onclick = () => {
        if (typeof onRefresh === 'function') {
          onRefresh();
        }
      };
    }

    const dismissBtn = document.getElementById('update-dismiss-btn');
    if (dismissBtn) {
      dismissBtn.onclick = () => {
        toast.hidden = true;
      };
    }
  }
}
