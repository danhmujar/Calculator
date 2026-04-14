import { registerSW } from 'virtual:pwa-register';

/**
 * PWAManager - Handles Service Worker registration, installation prompts, and offline state.
 */
export class PWAManager {
  constructor() {
    this.deferredInstallPrompt = null;
    this.updateSW = null;
    this.currentVersion = null;
    this.installPromptHandler = null;
    this.appInstalledHandler = null;
    this.isInitialized = false;
    this.installAttempts = 0;
    this.maxInstallAttempts = 3;
    this.cleanupTimer = null;
    this.buttonUpdateTimer = null;
    this.visibilityChangeHandler = null;
    this.windowFocusHandler = null;
    this.onlineHandler = null;
    this.offlineHandler = null;
    this.beforeUnloadHandler = null;
  }

  getInstallStatus() {
    if (this.isAppInstalled()) return 'already-installed';
    if (!this.isInstallable()) return 'not-supported';
    if (!this.deferredInstallPrompt) return 'not-ready';
    return 'ready';
  }

  getToastMessage(status) {
    switch (status) {
      case 'already-installed':
        return 'App is already installed!';
      case 'not-supported':
        return "Your browser doesn't support app installation.";
      case 'not-ready':
        return 'Installation not ready. Try refreshing the page.';
      default:
        return null;
    }
  }

  init(showToastCallback) {
    if (this.isInitialized) {
      console.warn('PWA: Already initialized, skipping...');
      return;
    }

    try {
      this.setupOfflineHandlers(showToastCallback);
      this.setupInstallPrompt();
      this.registerServiceWorker(showToastCallback);
      this.startVersionPolling();

      this.bindInstallButton(showToastCallback);
      this.updateOfflineBadge();

      this.beforeUnloadHandler = () => this.cleanup();
      window.addEventListener('beforeunload', this.beforeUnloadHandler);

      this.isInitialized = true;
    } catch (error) {
      console.error('PWA: Initialization failed:', error);
      try {
        this.cleanup();
      } catch (cleanupError) {
        console.error(
          'PWA: Cleanup after failed init also failed:',
          cleanupError
        );
      }
    }
  }

  setupOfflineHandlers(showToastCallback) {
    this.onlineHandler = () => {
      this.updateOfflineBadge();
      showToastCallback('Back online');
    };
    this.offlineHandler = () => {
      this.updateOfflineBadge();
      showToastCallback('Working offline');
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  updateOfflineBadge() {
    const badge = document.getElementById('offline-badge');
    if (!badge) return;
    badge.hidden = navigator.onLine;
  }

  bindInstallButton(showToastCallback) {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', () =>
        this.handleInstallClick(showToastCallback)
      );
    }
  }

  isInstallable() {
    return (
      'beforeinstallprompt' in window ||
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    );
  }

  isAppInstalled() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  updateInstallButtonVisibility() {
    if (this.buttonUpdateTimer) {
      clearTimeout(this.buttonUpdateTimer);
    }

    this.buttonUpdateTimer = setTimeout(() => {
      const installBtn = document.getElementById('pwa-install-btn');
      if (!installBtn) {
        console.warn(
          'PWA: updateInstallButtonVisibility - installBtn not found in DOM!'
        );
        return;
      }

      const isAppInstalled = this.isAppInstalled();
      const hasPrompt = this.deferredInstallPrompt !== null;

      // If we have a prompt, it's inherently installable.
      const shouldShow = !isAppInstalled && hasPrompt;

      installBtn.hidden = !shouldShow;
    }, 100);
  }

  setupInstallPrompt() {
    // Create bound handlers for cleanup
    this.installPromptHandler = (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      this.updateInstallButtonVisibility();
    };

    this.appInstalledHandler = () => {
      this.deferredInstallPrompt = null;
      this.updateInstallButtonVisibility();
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', this.installPromptHandler);
    window.addEventListener('appinstalled', this.appInstalledHandler);

    // Watch for early-captured prompt or later captures
    const checkCapturedPrompt = () => {
      if (window.__pwa_deferred_prompt && !this.deferredInstallPrompt) {
        console.log('PWA: retrieving early-captured prompt');
        this.deferredInstallPrompt = window.__pwa_deferred_prompt;
        this.updateInstallButtonVisibility();
      }
    };

    window.addEventListener('pwa-prompt-captured', checkCapturedPrompt);
    checkCapturedPrompt();
  }

  cleanup() {
    if (this.installPromptHandler) {
      window.removeEventListener(
        'beforeinstallprompt',
        this.installPromptHandler
      );
      this.installPromptHandler = null;
    }

    if (this.appInstalledHandler) {
      window.removeEventListener('appinstalled', this.appInstalledHandler);
      this.appInstalledHandler = null;
    }

    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }

    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
      this.offlineHandler = null;
    }

    if (this.visibilityChangeHandler) {
      document.removeEventListener(
        'visibilitychange',
        this.visibilityChangeHandler
      );
      this.visibilityChangeHandler = null;
    }

    if (this.windowFocusHandler) {
      window.removeEventListener('focus', this.windowFocusHandler);
      this.windowFocusHandler = null;
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.buttonUpdateTimer) {
      clearTimeout(this.buttonUpdateTimer);
      this.buttonUpdateTimer = null;
    }

    this.deferredInstallPrompt = null;
    this.updateSW = null;
    this.isInitialized = false;
  }

  handleInstallClick(showToastCallback) {
    const status = this.getInstallStatus();
    const toastMessage = this.getToastMessage(status);

    if (toastMessage) {
      showToastCallback(toastMessage);
      return;
    }

    this.deferredInstallPrompt.prompt();

    this.deferredInstallPrompt.userChoice
      .then((choiceResult) => {
        this.installAttempts = 0;

        if (choiceResult.outcome === 'accepted') {
          showToastCallback('App installed successfully!');
        } else {
          showToastCallback('App installation cancelled.');
        }
        this.deferredInstallPrompt = null;
        this.updateInstallButtonVisibility();
      })
      .catch((error) => {
        console.error('Install prompt error:', error);
        this.handleInstallError(error, showToastCallback);
      });
  }

  handleInstallError(error, showToastCallback) {
    this.installAttempts++;

    if (this.installAttempts >= this.maxInstallAttempts) {
      showToastCallback('Installation failed. Please try again later.');
      this.cleanupTimer = setTimeout(() => this.resetInstallState(), 30000);
    } else {
      showToastCallback(
        `Installation failed (${this.installAttempts}/${this.maxInstallAttempts}). Retrying...`
      );
    }

    this.deferredInstallPrompt = null;
    this.updateInstallButtonVisibility();
  }

  resetInstallState() {
    this.installAttempts = 0;
    this.deferredInstallPrompt = null;
    this.updateInstallButtonVisibility();
  }

  async startVersionPolling() {
    await this.checkVersion();

    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        this.checkVersion();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    this.windowFocusHandler = () => {
      this.checkVersion();
    };
    window.addEventListener('focus', this.windowFocusHandler);

    setInterval(() => this.checkVersion(), 300000);
  }

  async checkVersion() {
    try {
      // In Vite, base URL is provided via import.meta.env.BASE_URL
      const baseUrl = import.meta.env.BASE_URL || '/';
      // Use timestamp to bypass cache
      const response = await fetch(`${baseUrl}version.json?t=${Date.now()}`, {
        cache: 'no-store',
      });

      if (!response.ok) return;

      const data = await response.json();

      if (!this.currentVersion) {
        this.currentVersion = data.version;
        console.log(`PWA: Initial version cached: ${this.currentVersion}`);
        return;
      }

      if (this.currentVersion !== data.version) {
        console.log(
          `PWA: New version detected: ${data.version} (current: ${this.currentVersion})`
        );
        this.currentVersion = data.version;

        // Trigger Service Worker update check
        if (this.updateSW) {
          console.log('PWA: Triggering Service Worker update check...');
          this.updateSW();
        }
      }
    } catch (error) {
      console.error('PWA: Failed to check version:', error);
    }
  }

  registerServiceWorker(showToastCallback) {
    const self = this;
    this.updateSW = registerSW({
      onNeedRefresh() {
        console.log('PWA: New content available, please refresh.');
        // Dispatch custom event for the UI layer to handle
        window.dispatchEvent(
          new CustomEvent('pwa-update-available', {
            detail: {
              updateCallback: () => {
                if (typeof self.updateSW === 'function') {
                  self.updateSW(true);
                }
              },
            },
          })
        );
      },
      onOfflineReady() {
        showToastCallback('App ready for offline use');
      },
    });
  }
}

export const pwaManager = new PWAManager();
