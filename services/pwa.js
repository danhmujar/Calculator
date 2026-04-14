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
  }

  init(showToastCallback) {
    this.setupOfflineHandlers(showToastCallback);
    this.setupInstallPrompt();
    this.registerServiceWorker(showToastCallback);
    this.startVersionPolling();

    // Bind install button if it exists
    this.bindInstallButton(showToastCallback);
    this.updateOfflineBadge();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  setupOfflineHandlers(showToastCallback) {
    window.addEventListener('online', () => {
      this.updateOfflineBadge();
      showToastCallback('Back online');
    });
    window.addEventListener('offline', () => {
      this.updateOfflineBadge();
      showToastCallback('Working offline');
    });
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
    // Check if the browser supports PWA installation
    return (
      'beforeinstallprompt' in window ||
      window.navigator.standalone === true || // iOS Safari
      window.matchMedia('(display-mode: standalone)').matches
    ); // Already installed PWA
  }

  isAppInstalled() {
    // Check if app is already running in standalone mode (installed)
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  updateInstallButtonVisibility() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (!installBtn) return;

    // Show button only if:
    // 1. Browser supports installation
    // 2. App is not already installed
    // 3. We have a deferred install prompt
    const shouldShow =
      this.isInstallable() &&
      !this.isAppInstalled() &&
      this.deferredInstallPrompt !== null;

    installBtn.hidden = !shouldShow;
  }

  getInstallStatus() {
    if (this.isAppInstalled()) return 'already-installed';
    if (!this.isInstallable()) return 'not-supported';
    if (!this.deferredInstallPrompt) return 'not-ready';
    return 'ready';
  }

  setupInstallPrompt() {
    // Check if app is already installed on initialization
    if (this.isAppInstalled()) {
      console.log('PWA: App is already installed, hiding install button');
      this.updateInstallButtonVisibility();
      return;
    }

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
  }

  cleanup() {
    // Remove event listeners to prevent memory leaks
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

    // Clear references
    this.deferredInstallPrompt = null;
    this.updateSW = null;
  }

  handleInstallClick(showToastCallback) {
    const status = this.getInstallStatus();

    switch (status) {
      case 'already-installed':
        showToastCallback('App is already installed!');
        return;

      case 'not-supported':
        showToastCallback("Your browser doesn't support app installation.");
        return;

      case 'not-ready':
        showToastCallback('Installation not ready. Try refreshing the page.');
        return;

      case 'ready':
        // Show the install prompt
        this.deferredInstallPrompt.prompt();

        // Handle user's choice
        this.deferredInstallPrompt.userChoice
          .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              showToastCallback('App installed successfully!');
            } else {
              showToastCallback('App installation cancelled.');
            }
            // Clear the deferred prompt regardless of outcome
            this.deferredInstallPrompt = null;
            this.updateInstallButtonVisibility();
          })
          .catch((error) => {
            console.error('Install prompt error:', error);
            showToastCallback('Installation failed. Please try again.');
            this.deferredInstallPrompt = null;
            this.updateInstallButtonVisibility();
          });
        return;
    }
  }

  async startVersionPolling() {
    // Initial fetch to get current version
    await this.checkVersion();

    // Check on visibility change (user comes back to tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkVersion();
      }
    });

    // Check on window focus (switching back from IDE/other app)
    window.addEventListener('focus', () => {
      this.checkVersion();
    });

    // Periodic check every 5 minutes (300000 ms)
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
