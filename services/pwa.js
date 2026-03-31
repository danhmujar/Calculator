import { registerSW } from 'virtual:pwa-register';

/**
 * PWAManager - Handles Service Worker registration, installation prompts, and offline state.
 */
export class PWAManager {
    constructor() {
        this.deferredInstallPrompt = null;
        this.updateSW = null;
    }

    init(showToastCallback) {
        this.setupOfflineHandlers(showToastCallback);
        this.setupInstallPrompt();
        this.registerServiceWorker(showToastCallback);
        
        // Bind install button if it exists
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.addEventListener('click', () => this.handleInstallClick(showToastCallback));
        }
        this.updateOfflineBadge();
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

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredInstallPrompt = e;
            const installBtn = document.getElementById('pwa-install-btn');
            if (installBtn) installBtn.hidden = false;
        });

        window.addEventListener('appinstalled', (e) => {
            this.deferredInstallPrompt = null;
            const installBtn = document.getElementById('pwa-install-btn');
            if (installBtn) installBtn.hidden = true;
            console.log('PWA was installed');
        });
    }

    handleInstallClick(showToastCallback) {
        if (!this.deferredInstallPrompt) {
            showToastCallback('App is already installed or not available.');
            return;
        }
        this.deferredInstallPrompt.prompt();
        this.deferredInstallPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showToastCallback('App installed!');
            }
            this.deferredInstallPrompt = null;
            const installBtn = document.getElementById('pwa-install-btn');
            if (installBtn) installBtn.hidden = true;
        });
    }

    registerServiceWorker(showToastCallback) {
        this.updateSW = registerSW({
            onNeedRefresh() {
                const updateToast = document.getElementById('update-toast');
                if (updateToast) {
                    updateToast.hidden = false;
                    const refreshBtn = document.getElementById('update-refresh-btn');
                    if (refreshBtn) {
                        refreshBtn.addEventListener('click', () => {
                            if (this.updateSW) this.updateSW(true);
                        }, { once: true });
                    }
                    const dismissBtn = document.getElementById('update-dismiss-btn');
                    if (dismissBtn) {
                        dismissBtn.addEventListener('click', () => {
                            updateToast.hidden = true;
                        }, { once: true });
                    }
                }
            },
            onOfflineReady() {
                showToastCallback('App ready for offline use');
            },
        });
    }
}

export const pwaManager = new PWAManager();
