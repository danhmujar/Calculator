/**
 * PWA Early Capture Script
 * This script runs as early as possible in the <head> to capture the 'beforeinstallprompt' event.
 * Using an external file avoids CSP 'unsafe-inline' violations.
 */
window.__pwa_deferred_prompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  window.__pwa_deferred_prompt = e;
  // Notify the app if it's already loaded
  window.dispatchEvent(new CustomEvent('pwa-prompt-captured'));
});
