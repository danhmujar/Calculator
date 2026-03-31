import { uiManager } from '../ui/uimanager.js';

/**
 * EventManager - Centralized Event Delegation & Binding
 * Extracts global event listeners from app.js to simplify the orchestrator.
 */
export class EventManager {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.contextMenu = document.getElementById('calc-context-menu');
        this.pasteBtn = document.getElementById('calc-context-paste');
        this.calcDisplay = document.getElementById('main-calc-display');
    }

    init() {
        this.bindKeypadEvents();
        this.bindLeftPanelEvents();
        this.bindSidebarEvents();
        this.bindExternalUIEvents();
        this.bindGlobalEvents();
        this.bindContextMenuEvents();
        this.bindKeyboardShortcuts();
    }

    bindKeypadEvents() {
        const keypad = document.getElementById('calc-keypad');
        if (!keypad) return;

        keypad.addEventListener('click', (e) => {
            const btn = e.target.closest('.calc-btn');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const value = btn.getAttribute('data-value');
            
            switch (action) {
                case 'digit': this.callbacks.onDigit(value); break;
                case 'op': this.callbacks.onOperation(value); break;
                case 'memory': this.callbacks.onMemory(value); break;
                case 'clear': this.callbacks.onAction('clear'); break;
                case 'backspace': this.callbacks.onAction('backspace'); break;
                case 'percent': this.callbacks.onPercentage(); break;
                case 'equals': this.callbacks.onEquals(); break;
            }
        });
    }

    bindLeftPanelEvents() {
        const leftPanel = document.querySelector('.left-panel');
        if (!leftPanel) return;

        leftPanel.addEventListener('click', (e) => {
            const addRowBtn = e.target.closest('[data-add-row]');
            if (addRowBtn) {
                uiManager.addRow(addRowBtn, addRowBtn.getAttribute('data-add-row'));
            }
        });

        leftPanel.addEventListener('input', () => this.callbacks.onTriggerSave());
    }

    bindSidebarEvents() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        sidebar.addEventListener('click', (e) => {
            const modeBtn = e.target.closest('[data-mode]');
            if (modeBtn) {
                uiManager.setCalcMode(modeBtn.getAttribute('data-mode'));
                return;
            }

            if (e.target.closest('#history-toggle-btn') || e.target.closest('#history-back-btn')) {
                uiManager.toggleHistory();
                return;
            }

            if (e.target.closest('#clear-tape-btn')) {
                uiManager.clearAuditTape();
                this.callbacks.onClearAudit();
                return;
            }

            if (e.target.closest('#close-drawer-btn')) {
                uiManager.toggleDrawer();
                return;
            }

            if (e.target.closest('#add-math-btn')) {
                uiManager.addScientificRow();
                return;
            }
        });

        const sciContainer = sidebar.querySelector('.scientific-container');
        if (sciContainer) {
            sciContainer.addEventListener('input', () => this.callbacks.onTriggerSave());
        }
    }

    bindExternalUIEvents() {
        const mobileBtn = document.getElementById('mobile-panel-toggle-btn');
        if (mobileBtn) mobileBtn.addEventListener('click', () => uiManager.toggleDrawer());

        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', () => {
                const sidebarEl = document.getElementById('sidebar');
                if (sidebarEl && !sidebarEl.classList.contains('open')) {
                    uiManager.toggleDrawer();
                }
            });
        }

        document.addEventListener('click', (event) => {
            const dropdown = document.getElementById('theme-dropdown-container');
            if (dropdown && dropdown.classList.contains('active') && !dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
            }
            if (event.target.closest('button')) this.callbacks.onTriggerSave();
        });
    }

    bindGlobalEvents() {
        document.addEventListener('paste', (e) => {
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'math-field' || tag === 'textarea') return;
            
            const pasteData = (e.clipboardData || window.clipboardData).getData('text');
            if (!pasteData) return;

            this.handlePaste(pasteData);
        });
    }

    bindContextMenuEvents() {
        if (!this.calcDisplay || !this.contextMenu || !this.pasteBtn) return;

        this.calcDisplay.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.contextMenu.style.left = `${e.clientX}px`;
            this.contextMenu.style.top = `${e.clientY}px`;
            this.contextMenu.hidden = false;
        });

        this.pasteBtn.addEventListener('click', async () => {
            this.contextMenu.hidden = true;
            try {
                const text = await navigator.clipboard.readText();
                if (text) this.handlePaste(text);
            } catch (err) {
                console.error("Failed to read clipboard", err);
                uiManager.showToast("Paste permission denied");
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.contextMenu.hidden && !this.contextMenu.contains(e.target)) {
                this.contextMenu.hidden = true;
            }
        });
    }

    handlePaste(text) {
        const cleaned = text.replace(/,/g, '');
        const match = cleaned.match(/-?\d+(?:\.\d+)?/);
        
        if (match) {
            this.callbacks.onPaste(match[0]);
            
            if (this.calcDisplay) {
                this.calcDisplay.style.color = 'var(--primary-blue)';
                setTimeout(() => { if (this.calcDisplay) this.calcDisplay.style.color = ''; }, 300);
            }
            
            this.callbacks.onTriggerSave();
            uiManager.showToast("Pasted Value");
        }
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'math-field') return;

            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('scientific-active')) return;

            if (e.key >= '0' && e.key <= '9') {
                this.callbacks.onDigit(e.key);
            } else if (e.key === '.') {
                this.callbacks.onDigit('.');
            } else if (e.key === 'Backspace') {
                this.callbacks.onAction('backspace');
            } else if (e.key === 'Escape') {
                this.callbacks.onAction('clear');
            } else if (e.key === '%') {
                this.callbacks.onPercentage();
            } else if (['+', '-', '*', '/'].includes(e.key)) {
                this.callbacks.onOperation(e.key);
            } else if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                this.callbacks.onEquals();
            }
        });
    }
}
