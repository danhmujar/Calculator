import { store } from './store.js';
import { uiManager } from '../ui/uimanager.js';
import { pwaManager } from './pwa.js';
import { CalculatorService } from './calculator.js';
import { initEyeTracking } from '../ui/eye-tracker.js';
import { EventManager } from './events.js';

/**
 * Percentage & Math Calculator - Orchestrator
 */
class AppOrchestrator {
    constructor() {
        this.MAX_AUDIT_ENTRIES = 100;
        this.SAVE_DEBOUNCE_MS = 500;
        this.INPUT_LENGTH_LIMIT = 15;
        this.auditEntries = [];
        this.saveTimeout = null;
        this.proFormatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4
        });

        this.calcState = this.initCalcStateProxy();
        window.uiManager = uiManager;
        window.app = this;
    }

    init() {
        window.addEventListener('DOMContentLoaded', () => {
            uiManager.init();
            pwaManager.init(uiManager.showToast.bind(uiManager));
            initEyeTracking();

            const eventManager = new EventManager({
                onDigit: (digit) => this.calcDigit(digit),
                onOperation: (op) => this.calcOperation(op),
                onMemory: (action) => this.calcMemory(action),
                onAction: (action) => this.calcAction(action),
                onPercentage: () => this.calcPercentage(),
                onEquals: () => this.calcEquals(),
                onTriggerSave: () => {
                    this.syncScientificRows();
                    this.syncPercentageCards();
                },
                onClearAudit: () => { this.calcState.auditData = []; },
                onPaste: (val) => {
                    this.calcState.currentValue = val;
                    this.calcState.resetNext = true;
                    if (this.calcState.operator === null) this.calcState.previousValue = null;
                    this.updateDisplay();
                }
            });
            eventManager.init();

            const loaded = this.loadState();
            if (!loaded) {
                document.querySelectorAll('.calc-card').forEach(card => {
                    const type = card.getAttribute('data-type');
                    const container = card.querySelector('.calc-rows-container');
                    if (container) container.appendChild(uiManager.createRow(type));
                });
            }

            // Subscribe rendering to store changes
            store.subscribe(() => this.updateDisplay());
        });
    }

    initCalcStateProxy() {
        return new Proxy({}, {
            get: (_, prop) => {
                const state = store.getState();
                if (state.persistent && prop in state.persistent) return state.persistent[prop];
                if (state.transient && prop in state.transient) return state.transient[prop];
                return state[prop];
            },
            set: (_, prop, value) => {
                const state = store.getState();
                if (state.persistent && prop in state.persistent) {
                    store.state.persistent[prop] = value;
                } else if (state.transient && prop in state.transient) {
                    store.state.transient[prop] = value;
                } else {
                    store.state[prop] = value;
                }
                return true;
            }
        });
    }

    loadState() {
        const saved = localStorage.getItem('interactiveCalcState');
        if (!saved) return false;

        try {
            const state = JSON.parse(saved);
            const effectiveState = state.persistent || state;
            store.setState({ persistent: effectiveState });
            
            uiManager.restoreState(effectiveState, {
                addAuditEntry: (a, b, op, res, expr) => this.addAuditEntry(a, b, op, res, false, expr)
            });
            
            return true;
        } catch (e) {
            console.error("Failed to load calc state", e);
            return false;
        }
    }

    updateDisplay() {
        uiManager.updateDisplay(this.calcState, uiManager.formatOperator.bind(uiManager));
    }

    syncScientificRows() {
        const rows = Array.from(document.querySelectorAll('math-field')).map(mf => mf.value);
        this.calcState.sciRows = rows;
    }

    syncPercentageCards() {
        const cardsData = {};
        document.querySelectorAll('.calc-card').forEach(card => {
            const type = card.getAttribute('data-type');
            const rows = [];
            card.querySelectorAll('.calc-row-instance').forEach(row => {
                const x = row.querySelector('.val-x').value;
                const y = row.querySelector('.val-y').value;
                rows.push({ x, y });
            });
            cardsData[type] = rows;
        });
        this.calcState.cards = cardsData;
    }

    calcDigit(digit) {
        if (this.calcState.resetNext) {
            this.calcState.currentValue = digit;
            this.calcState.resetNext = false;
        } else {
            if (this.calcState.currentValue.replace(/[^0-9]/g, '').length >= this.INPUT_LENGTH_LIMIT) return;

            if (digit === '.') {
                if (!this.calcState.currentValue.includes('.')) {
                    this.calcState.currentValue += '.';
                }
            } else {
                if (this.calcState.currentValue === '0' || this.calcState.currentValue === '-0') {
                    this.calcState.currentValue = this.calcState.currentValue.startsWith('-') ? '-' + digit : digit;
                } else {
                    this.calcState.currentValue += digit;
                }
            }
        }
        this.updateDisplay();
    }

    calcAction(action) {
        if (action === 'clear') {
            this.calcState.currentValue = '0';
            this.calcState.previousValue = null;
            this.calcState.operator = null;
            this.calcState.resetNext = false;
            this.updateDisplay();
        } else if (action === 'backspace') {
            if (this.calcState.resetNext) return;
            this.calcState.currentValue = this.calcState.currentValue.slice(0, -1);
            if (this.calcState.currentValue === '' || this.calcState.currentValue === '-') {
                this.calcState.currentValue = '0';
            }
            this.updateDisplay();
        }
    }

    calcMemory(action) {
        const val = parseFloat(this.calcState.currentValue);

        if (action === 'MC') {
            this.calcState.memoryValue = 0;
            uiManager.showToast("Memory Cleared");
        } else if (action === 'MR') {
            this.calcState.currentValue = this.calcState.memoryValue.toString();
            this.calcState.resetNext = true;
            this.updateDisplay();
            uiManager.showToast("Memory Recalled: " + this.proFormatter.format(this.calcState.memoryValue));
        } else if (action === 'M+') {
            if (!isNaN(val)) {
                this.calcState.memoryValue += val;
                this.calcState.resetNext = true;
                uiManager.showToast("Added to Memory");
            }
        } else if (action === 'M-') {
            if (!isNaN(val)) {
                this.calcState.memoryValue -= val;
                this.calcState.resetNext = true;
                uiManager.showToast("Subtracted from Memory");
            }
        }
        uiManager.updateMemoryIndicator(this.calcState.memoryValue);
    }

    calcPercentage() {
        let val = parseFloat(this.calcState.currentValue);
        if (!isNaN(val)) {
            this.calcState.currentValue = (val / 100).toString();
            if (this.calcState.resetNext === false && this.calcState.operator === null) {
                this.calcState.resetNext = true;
            }
            this.updateDisplay();
        }
    }

    calcOperation(op) {
        if (this.calcState.operator && !this.calcState.resetNext) {
            this.calcEquals(false);
        }
        this.calcState.previousValue = parseFloat(this.calcState.currentValue);
        this.calcState.operator = op;
        this.calcState.resetNext = true;
        this.updateDisplay();
    }

    calcEquals(logHistory = true) {
        if (this.calcState.operator && this.calcState.previousValue !== null) {
            const currentNum = parseFloat(this.calcState.currentValue);
            const prevNum = this.calcState.previousValue;
            const result = CalculatorService.evaluate(`a ${this.calcState.operator} b`, { a: prevNum, b: currentNum });

            if (result === null) {
                if (this.calcState.operator === '/' && currentNum === 0) {
                    uiManager.showToast('Cannot divide by zero');
                }
                return;
            }

            if (logHistory) {
                this.addAuditEntry(prevNum, currentNum, this.calcState.operator, result);
            }

            this.calcState.currentValue = result.toString();
            this.calcState.previousValue = null;
            this.calcState.operator = null;
            this.calcState.resetNext = true;
            this.updateDisplay();
        }
    }

    addAuditEntry(a, b, op, res, shouldSave = true, expr = null) {
        if (shouldSave) {
            this.auditEntries.unshift(expr ? { expr, res } : { a, b, op, res });
            if (this.auditEntries.length > this.MAX_AUDIT_ENTRIES) this.auditEntries.length = this.MAX_AUDIT_ENTRIES;
        }
        uiManager.addAuditEntry(a, b, op, res, uiManager.formatOperator.bind(uiManager), (val) => this.useAuditValue(val), expr);
    }

    useAuditValue(val) {
        this.calcState.currentValue = val.toString();
        this.calcState.resetNext = true;
        this.updateDisplay();
        uiManager.toggleHistory();
        const displayEl = document.getElementById('main-calc-display');
        if (window.innerWidth <= 1024 && displayEl) {
            displayEl.style.color = 'var(--primary-blue)';
            setTimeout(() => { if (displayEl) displayEl.style.color = ''; }, 300);
        }
    }
}

const app = new AppOrchestrator();
app.init();
export { app };
