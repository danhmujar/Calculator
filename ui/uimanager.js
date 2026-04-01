import { store } from '../services/store.js';
import { renderer } from './renderer.js';
import { CalculatorService } from '../services/calculator.js';
import { WebGLContext } from './webgl/context.js';
import { WebGLRenderer } from './webgl/renderer.js';
import { TypographyManager } from './webgl/typography.js';

/**
 * UIManager - Coordinates DOM layout, theme management, and UI transitions.
 */
export class UIManager {
    constructor() {
        this.TOAST_DURATION_MS = 2000;
        this.MATH_EXPR_LIMIT = 1000;
        this.toastTimeout = null;
        this.lastDisplayText = '';
        this.lastContainerWidth = 0;

        this.typography = new TypographyManager();
        this.typography.onLayoutUpdate((glyphs) => {
            if (this.webglRenderer) {
                this.webglRenderer.render();
            }
        });

        this.VALID_THEMES = [
            'theme-teal', 'theme-terracotta', 'theme-forest', 'theme-slate',
            'theme-rosewood', 'theme-pistachio', 'theme-purple',
            'theme-aurora', 'theme-aurora-ocean', 'theme-aurora-cyber', 'theme-aurora-sunset',
            '' // Default theme
        ];

        this.VALID_CARD_TYPES = ['type1', 'type2', 'type3', 'type4'];

        this.ROW_BUILDERS = {
            'type1': (parent) => {
                const group = document.createElement('div');
                group.className = 'input-group';
                const x = this.createRowInput('val-x', 'X', 'First value');
                const span = document.createElement('span');
                span.textContent = 'is what % of';
                const y = this.createRowInput('val-y', 'Y', 'Second value');
                group.append(x, ' ', span, ' ', y);
                parent.appendChild(group);
            },
            'type2': (parent) => {
                const group = document.createElement('div');
                group.className = 'input-group';
                const span1 = document.createElement('span');
                span1.textContent = 'What is';
                const x = this.createRowInput('val-x', 'X %', 'Percentage');
                const span2 = document.createElement('span');
                span2.textContent = '% of';
                const y = this.createRowInput('val-y', 'Y', 'Value');
                group.append(span1, ' ', x, ' ', span2, ' ', y);
                parent.appendChild(group);
            },
            'type3': (parent) => {
                const group = document.createElement('div');
                group.className = 'input-group';
                const span1 = document.createElement('span');
                span1.textContent = 'Change from';
                const x = this.createRowInput('val-x', 'X', 'Original value');
                const span2 = document.createElement('span');
                span2.textContent = 'to';
                const y = this.createRowInput('val-y', 'Y', 'New value');
                group.append(span1, ' ', x, ' ', span2, ' ', y);
                parent.appendChild(group);
            },
            'type4': (parent) => {
                const group = document.createElement('div');
                group.className = 'input-group';
                const x = this.createRowInput('val-x', 'X', 'Partial value');
                const span1 = document.createElement('span');
                span1.textContent = 'is';
                const y = this.createRowInput('val-y', 'P %', 'Percentage');
                const span2 = document.createElement('span');
                span2.textContent = '% of what?';
                group.append(x, ' ', span1, ' ', y, ' ', span2);
                parent.appendChild(group);
            }
        };

        this.proFormatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4
        });

        this.themeColors = {
            primary: [0, 0.32, 0.8, 1], // Default Financial Blue
            accent: [0.96, 0.62, 0.04, 1], // Default Warning
            background: [0.96, 0.96, 0.97, 1] // Default BG
        };
    }

    /**
     * Extracts a CSS variable value and converts it to a normalized RGBA array.
     * @param {string} variableName - The CSS variable name (e.g., '--primary-blue')
     * @returns {number[]} Normalized RGBA [0.0 - 1.0]
     */
    getThemeColor(variableName) {
        const value = getComputedStyle(document.body).getPropertyValue(variableName).trim();
        if (!value) return [0, 0, 0, 1];
        return this.parseColor(value);
    }

    /**
     * Parses CSS color strings (hex, rgb, rgba) into normalized arrays.
     */
    parseColor(colorStr) {
        // Handle hex
        if (colorStr.startsWith('#')) {
            let r = 0, g = 0, b = 0;
            if (colorStr.length === 4) {
                r = parseInt(colorStr[1] + colorStr[1], 16);
                g = parseInt(colorStr[2] + colorStr[2], 16);
                b = parseInt(colorStr[3] + colorStr[3], 16);
            } else {
                r = parseInt(colorStr.slice(1, 3), 16);
                g = parseInt(colorStr.slice(3, 5), 16);
                b = parseInt(colorStr.slice(5, 7), 16);
            }
            return [r / 255, g / 255, b / 255, 1.0];
        }
        // Handle rgb/rgba
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            return [
                parseInt(match[1]) / 255,
                parseInt(match[2]) / 255,
                parseInt(match[3]) / 255,
                match[4] ? parseFloat(match[4]) : 1.0
            ];
        }
        return [0, 0, 0, 1];
    }

    /**
     * Synchronizes WebGL theme cache with current DOM styles.
     */
    syncThemeColors() {
        this.themeColors.primary = this.getThemeColor('--primary-blue');
        this.themeColors.accent = this.getThemeColor('--warning');
        this.themeColors.background = this.getThemeColor('--bg-color');

        if (this.webglRenderer) {
            this.webglRenderer.themeColors = this.themeColors;
            // Schedule the render to avoid redundancy during initialization
            renderer.schedule(() => this.webglRenderer.render());
        }
    }

    createRowInput(name, placeholder, ariaLabel) {
        const input = document.createElement('input');
        input.type = 'number';
        input.name = name;
        input.className = name;
        input.placeholder = placeholder;
        input.step = 'any';
        input.autocomplete = 'off';
        input.setAttribute('aria-label', ariaLabel);
        return input;
    }

    /**
     * Converts internal operators to display symbols (REQ-UI-01)
     */
    formatOperator(op) {
        switch (op) {
            case '*': return '×';
            case '/': return '÷';
            case '-': return '−';
            default: return op;
        }
    }

    init() {
        this.displayEl = document.getElementById('main-calc-display');
        this.previewEl = document.getElementById('main-calc-prev');
        this.auditList = document.getElementById('audit-list');
        this.memoryIndicatorEl = document.getElementById('memory-indicator');

        // Initialize WebGL Underlay (REQ-WGL-01)
        this.webgl = new WebGLContext();
        this.webglRenderer = new WebGLRenderer(this.webgl);
        const layoutContainer = document.querySelector('.layout-container');
        if (layoutContainer && this.webgl.canvas) {
            layoutContainer.prepend(this.webgl.canvas);
            document.body.classList.add('webgl-active');
            // Schedule initial render for verification (avoids conflict with syncThemeColors)
            renderer.schedule(() => this.webglRenderer.render());
        }

        this.setupEntranceAnimations();
        this.setupResizeHandler();
        this.setupA11y();
        this.setupKeyboardShortcuts();
        this.setupPasteSupport();
        this.setupFocusHandling();
        this.setupThemePicker();
        this.syncThemeColors();
    }

    setupThemePicker() {
        const picker = document.querySelector('.theme-picker');
        if (picker) {
            picker.addEventListener('click', (e) => {
                const swatch = e.target.closest('.theme-swatch');
                if (!swatch) return;
                this.setThemeColor(swatch, swatch.getAttribute('data-theme'));
            });
        }

        const paletteBtn = document.getElementById('palette-toggle-btn');
        if (paletteBtn) {
            paletteBtn.addEventListener('click', (e) => {
                this.togglePaletteDropdown(e);
            });
        }

        const themeCheckbox = document.getElementById('checkbox');
        if (themeCheckbox) {
            themeCheckbox.addEventListener('change', () => this.toggleTheme());
        }

        document.addEventListener('click', (event) => {
            const dropdown = document.getElementById('theme-dropdown-container');
            if (dropdown && dropdown.classList.contains('active') && !dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    togglePaletteDropdown(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('theme-dropdown-container');
        if (dropdown) dropdown.classList.toggle('active');
    }

    setupFocusHandling() {
        // Handle MathLive virtual keyboard focus restoration (REQ-UI-05)
        setTimeout(() => {
            if (window.mathVirtualKeyboard) {
                window.mathVirtualKeyboard.addEventListener('virtual-keyboard-toggle', () => {
                    if (window.mathVirtualKeyboard.visible) {
                        const target = document.querySelector('math-field.last-focused') || document.querySelector('math-field');
                        if (target) {
                            setTimeout(() => target.focus(), 50);
                        }
                    }
                });
            }
        }, 500);
    }

    restoreState(state, callbacks = {}) {
        if (!state) return;

        // 1. Theme and Mode
        this.restoreThemeAndMode(state);

        // 2. Audit Tape
        if (state.auditData && Array.isArray(state.auditData) && callbacks.addAuditEntry) {
            state.auditData.slice().reverse().forEach(entry => {
                if (typeof entry.a === 'number' && typeof entry.b === 'number' &&
                    typeof entry.op === 'string' && typeof entry.res === 'number' &&
                    isFinite(entry.a) && isFinite(entry.b) && isFinite(entry.res)) {
                    callbacks.addAuditEntry(entry.a, entry.b, entry.op, entry.res);
                }
            });
        }

        // 3. Percentage Cards
        this.restorePercentageCards(state);

        // 4. Scientific Rows
        this.restoreScientificRows(state);
    }

    restoreThemeAndMode(state) {
        if (state.darkMode && !document.body.classList.contains('dark-theme')) this.toggleTheme();
        if (!state.darkMode && document.body.classList.contains('dark-theme')) this.toggleTheme();

        const checkbox = document.getElementById('checkbox');
        if (checkbox) checkbox.checked = state.darkMode;

        if (state.theme && this.VALID_THEMES.includes(state.theme)) {
            const btn = document.querySelector('.theme-swatch[data-theme="' + state.theme + '"]');
            if (btn) this.setThemeColor(btn, state.theme);
        }

        if (state.mode === 'scientific') {
            const isMobileDrawer = window.matchMedia('(max-width: 1024px)').matches;
            if (!isMobileDrawer) {
                this.setCalcMode('scientific');
            }
        }
    }

    restorePercentageCards(state) {
        this.VALID_CARD_TYPES.forEach(type => {
            const card = document.querySelector(`.calc-card[data-type="${type}"]`);
            if (card) {
                const container = card.querySelector('.calc-rows-container');
                if (!container) return;

                container.replaceChildren();
                const rows = (state.cards && state.cards[type]) || [];
                if (rows.length === 0) {
                    container.appendChild(this.createRow(type));
                } else {
                    rows.forEach(rowData => {
                        const newRow = this.createRow(type);
                        const x = newRow.querySelector('.val-x');
                        const y = newRow.querySelector('.val-y');
                        if (x && y) {
                            x.value = rowData.x || '';
                            y.value = rowData.y || '';
                            container.appendChild(newRow);
                            x.dispatchEvent(new Event('input'));
                        }
                    });
                }
            }
        });
    }

    restoreScientificRows(state) {
        if (state.sciRows && state.sciRows.length > 0) {
            const sciWrapper = document.querySelector('.sci-rows-wrapper');
            if (sciWrapper) {
                sciWrapper.replaceChildren();
                state.sciRows.forEach((val, index) => {
                    this.addScientificRow(val); // Pass val to handle restoration internally
                });
            }
        }
    }

    setupEntranceAnimations() {
        const header = document.querySelector('.left-panel header');
        if (header) {
            header.classList.add('anim-fade-up');
            header.style.animationDelay = '0.05s';
        }
        document.querySelectorAll('.calc-card').forEach((card, i) => {
            card.classList.add('anim-fade-up');
            card.style.animationDelay = `${0.1 + (i * 0.08)}s`;
        });
        const rightPanel = document.querySelector('.right-panel');
        if (rightPanel) {
            rightPanel.classList.add('anim-slide-right');
            rightPanel.style.animationDelay = '0.1s';

            rightPanel.addEventListener('animationend', () => {
                rightPanel.classList.remove('anim-slide-right');
            }, { once: true });

            if (window.innerWidth > 1024) {
                rightPanel.addEventListener('animationend', () => {
                    rightPanel.classList.add('open');
                }, { once: true });
            }
        }
    }

    setupResizeHandler() {
        const rightPanel = document.querySelector('.right-panel');
        let wasMobile = window.innerWidth <= 1024;
        window.addEventListener('resize', () => {
            const isDesktop = window.innerWidth > 1024;
            if (isDesktop && wasMobile && rightPanel && !rightPanel.classList.contains('open')) {
                void rightPanel.offsetWidth;
                requestAnimationFrame(() => {
                    rightPanel.classList.add('open');
                });
            }
            wasMobile = !isDesktop;

            // Synchronize WebGL viewport (REQ-WGL-01)
            if (this.webgl) {
                this.webgl.resize();
            }
            if (this.webglRenderer) {
                this.webglRenderer.render();
            }
        });

        // REQ-UI-06: Robust text fitting via ResizeObserver to handle side-panel transitions and resizer handle.
        if (typeof ResizeObserver !== 'undefined' && this.displayEl) {
            const displayContainer = this.displayEl.parentElement;
            if (displayContainer) {
                const ro = new ResizeObserver(() => {
                    // Re-calculate fit whenever the container size changes (e.g., mode toggle, window resize, or sidebar drag)
                    if (this.lastDisplayText) {
                        this.fitDisplayText(this.lastDisplayText);
                    }
                });
                ro.observe(displayContainer);
            }
        }
    }

    setupA11y() {
        document.querySelectorAll('button[title]:not([aria-label])').forEach(btn => {
            btn.setAttribute('aria-label', btn.getAttribute('title'));
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'math-field') return;

            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('scientific-active')) return;

            // These will be handled by app.js through callbacks or custom events if needed, 
            // but for simplicity we can keep the logic here if it just calls calc functions.
            // However, the plan says UIManager should coordinate, so maybe app.js should handle shortcuts 
            // and call UIManager for UI updates? 
            // Actually, the shortcuts often trigger calculations.
        });
    }

    setupPasteSupport() {
        // ... (Logic from app.js bindEvents)
    }

    calculateRowResult(type, x, y) {
        const result = CalculatorService.calculatePercentage(type, x, y);
        
        if (result === null) {
            return (type === 'type1' || type === 'type3') ? '0.00%' : '0.00';
        }
        if (result === 'Error') {
            return 'Error';
        }

        if (type === 'type1') {
            return this.proFormatter.format(result) + '%';
        }
        if (type === 'type3') {
            const sign = result > 0 ? '+' : '';
            return sign + this.proFormatter.format(result) + '%';
        }
        
        return this.proFormatter.format(result);
    }

    createRow(type) {
        const container = document.createElement('div');
        container.className = 'calc-row-instance';

        const uniqueId = 'res-' + crypto.randomUUID().slice(0, 8);

        const templateContainer = document.createElement('div');
        templateContainer.className = 'row-template-content';
        if (this.ROW_BUILDERS[type]) {
            this.ROW_BUILDERS[type](templateContainer);
        }
        container.appendChild(templateContainer);

        const resultGroup = document.createElement('div');
        resultGroup.className = 'result-group';

        const resultLabel = document.createElement('span');
        resultLabel.textContent = 'Result:';
        resultGroup.appendChild(resultLabel);

        const resultValue = document.createElement('span');
        resultValue.className = 'result-value';
        resultValue.id = uniqueId;
        resultValue.setAttribute('aria-live', 'polite');
        resultValue.textContent = (type === 'type1' || type === 'type3') ? '0.00%' : '0.00';
        resultGroup.appendChild(resultValue);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'icon-btn copy-row-btn';
        copyBtn.title = 'Copy to clipboard';
        copyBtn.setAttribute('aria-label', 'Copy result');
        copyBtn.appendChild(this.createCopySvg(18));
        resultGroup.appendChild(copyBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn delete-row-btn';
        deleteBtn.title = 'Delete Row';
        deleteBtn.setAttribute('aria-label', 'Delete row');

        const deleteSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        deleteSvg.setAttribute('width', '18');
        deleteSvg.setAttribute('height', '18');
        deleteSvg.setAttribute('aria-hidden', 'true');
        
        const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', './assets/sprites.svg#icon-delete');
        deleteSvg.appendChild(useEl);
        
        deleteBtn.appendChild(deleteSvg);
        resultGroup.appendChild(deleteBtn);

        container.appendChild(resultGroup);

        copyBtn.addEventListener('click', () => this.copyResult(uniqueId));
        deleteBtn.addEventListener('click', () => this.deleteRow(deleteBtn));

        const xInput = container.querySelector('.val-x');
        const yInput = container.querySelector('.val-y');
        const resEl = resultValue;

        const updater = () => {
            const xVal = parseFloat(xInput.value);
            const yVal = parseFloat(yInput.value);
            resEl.textContent = this.calculateRowResult(type,
                isNaN(xVal) ? null : xVal,
                isNaN(yVal) ? null : yVal
            );
        };

        xInput.addEventListener('input', updater);
        yInput.addEventListener('input', updater);

        return container;
    }

    addRow(btnEl, type) {
        const container = btnEl.closest('.calc-card').querySelector('.calc-rows-container');
        const newRow = this.createRow(type);

        newRow.classList.add('row-enter');
        container.appendChild(newRow);

        void newRow.offsetWidth;
        requestAnimationFrame(() => {
            newRow.style.maxHeight = newRow.scrollHeight + 'px';
            newRow.classList.remove('row-enter');

            newRow.addEventListener('transitionend', function handler(e) {
                if (e.propertyName === 'max-height') {
                    newRow.style.maxHeight = '';
                    newRow.removeEventListener('transitionend', handler);
                }
            }, { once: true });
        });
    }

    deleteRow(btnEl) {
        const rowInstance = btnEl.closest('.calc-row-instance');
        if (!rowInstance) return;

        rowInstance.style.maxHeight = rowInstance.scrollHeight + 'px';
        void rowInstance.offsetWidth;

        requestAnimationFrame(() => {
            rowInstance.classList.add('row-exit');

            const cleanup = () => {
                rowInstance.remove();
            };

            rowInstance.addEventListener('transitionend', function handler(e) {
                if (e.propertyName === 'max-height') {
                    cleanup();
                    rowInstance.removeEventListener('transitionend', handler);
                }
            }, { once: true });

            setTimeout(cleanup, 400);
        });
    }

    showToast(msg = "Copied to clipboard!") {
        const toast = document.getElementById('toast');
        if (!toast) return;

        clearTimeout(this.toastTimeout);
        toast.textContent = msg;
        toast.classList.add('show');
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, this.TOAST_DURATION_MS);
    }

    createCopySvg(size = 14) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('aria-hidden', 'true');

        const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', './assets/sprites.svg#icon-copy');
        svg.appendChild(useEl);
        
        return svg;
    }

    copyResult(elementId, hardcodedValue, isMathRow) {
        let textToCopy;
        if (isMathRow) {
            const el = document.getElementById(elementId);
            if (el) {
                textToCopy = el.textContent.replace('=', '').trim().replace(/[%,]/g, '');
            }
        } else if (hardcodedValue) {
            textToCopy = hardcodedValue.replace(/[%,]/g, '');
        } else {
            const el = document.getElementById(elementId);
            if (el) textToCopy = el.textContent.replace(/[%,]/g, '');
        }

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                this.showToast('Copied to clipboard!');
            }).catch(() => {
                this.showToast('Copy failed');
            });
        }
    }

    toggleDrawer() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            void sidebar.offsetWidth;
            requestAnimationFrame(() => {
                sidebar.classList.toggle('open');
                if (this.webglRenderer) {
                    renderer.schedule(() => this.webglRenderer.render());
                }
            });

            // Sync after transition
            const cleanup = (e) => {
                if (e.propertyName === 'transform' || e.propertyName === 'width') {
                    if (this.webglRenderer) renderer.schedule(() => this.webglRenderer.render());
                    sidebar.removeEventListener('transitionend', cleanup);
                }
            };
            sidebar.addEventListener('transitionend', cleanup);
        }
    }

    toggleHistory() {
        const historyDrawer = document.getElementById('history-drawer');
        if (historyDrawer) historyDrawer.classList.toggle('open');
    }

    toggleTheme() {
        const body = document.body;
        const isAurora = Array.from(body.classList).some(c => c.startsWith('theme-aurora'));
        if (isAurora && body.classList.contains('dark-theme')) {
            body.classList.remove('theme-aurora', 'theme-aurora-ocean', 'theme-aurora-cyber', 'theme-aurora-sunset');

            const picker = document.querySelector('.theme-picker');
            if (picker) {
                picker.querySelectorAll('.theme-swatch').forEach(btn => btn.classList.remove('active'));
                const defaultSwatch = picker.querySelector('.theme-swatch[data-theme=""]');
                if (defaultSwatch) defaultSwatch.classList.add('active');
            }
        }

        body.classList.toggle('dark-theme');

        const checkbox = document.getElementById('checkbox');
        if (checkbox) {
            checkbox.checked = body.classList.contains('dark-theme');
        }

        this.syncThemeColors();
    }

    setThemeColor(btnEl, themeClass) {
        if (themeClass && !this.VALID_THEMES.includes(themeClass)) return;

        const picker = document.querySelector('.theme-picker');
        if (picker) {
            picker.querySelectorAll('.theme-swatch').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-checked', 'false');
            });
        }
        btnEl.classList.add('active');
        btnEl.setAttribute('aria-checked', 'true');

        document.body.classList.remove('theme-teal', 'theme-terracotta', 'theme-forest', 'theme-slate', 'theme-rosewood', 'theme-pistachio', 'theme-purple', 'theme-aurora', 'theme-aurora-ocean', 'theme-aurora-cyber', 'theme-aurora-sunset');

        if (themeClass) {
            document.body.classList.add(themeClass);

            if (themeClass.startsWith('theme-aurora')) {
                document.body.classList.add('dark-theme');
                const checkbox = document.getElementById('checkbox');
                if (checkbox) checkbox.checked = true;
            }
        }

        const dropdown = document.getElementById('theme-dropdown-container');
        if (dropdown) dropdown.classList.remove('active');

        this.syncThemeColors();
    }

    updateMemoryIndicator(memoryValue) {
        if (!this.memoryIndicatorEl) return;
        this.memoryIndicatorEl.hidden = memoryValue === 0;
    }

    fitDisplayText(text) {
        if (!this.displayEl) return;
        const container = this.displayEl.parentElement;
        const containerWidth = container.clientWidth - 48;

        if (text === this.lastDisplayText && containerWidth === this.lastContainerWidth) {
            return;
        }

        this.lastDisplayText = text;
        this.lastContainerWidth = containerWidth;

        const res = renderer.fitDisplayText(text, containerWidth, {
            minRem: 1.0,
            maxRem: 2.5,
            remToPx: 16
        });

        this.displayEl.textContent = res.text;
        this.displayEl.style.fontSize = res.fontSizeRem + 'rem';
    }

    updateDisplay(calcState, formatOperator) {
        renderer.schedule(() => {
            if (!this.displayEl || !this.previewEl) return;

            let hasDot = calcState.currentValue.endsWith('.');
            let targetVal = parseFloat(calcState.currentValue);
            if (isNaN(targetVal)) targetVal = 0;

            let formatted = this.proFormatter.format(targetVal);
            if (hasDot) formatted += '.';

            this.fitDisplayText(formatted);

            if (calcState.previousValue !== null && calcState.operator) {
                const opStr = formatOperator(calcState.operator);
                this.previewEl.textContent = `${this.proFormatter.format(calcState.previousValue)} ${opStr}`;
            } else {
                this.previewEl.textContent = '';
            }

            if (this.webglRenderer) {
                this.webglRenderer.render();
            }
        });
    }

    addAuditEntry(a, b, op, res, formatOperator, useAuditValueCallback) {
        const opStr = formatOperator(op);
        const equation = this.proFormatter.format(a) + ' ' + opStr + ' ' + this.proFormatter.format(b);
        const resultFormat = this.proFormatter.format(res);

        const li = document.createElement('li');
        li.className = 'audit-item';

        const eqDiv = document.createElement('div');
        eqDiv.className = 'audit-equation';
        eqDiv.textContent = equation + ' =';

        const resultRow = document.createElement('div');
        resultRow.className = 'audit-result-row';

        const actionsDiv = this.createAuditActions(res, resultFormat, useAuditValueCallback);
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
        copyBtn.setAttribute('aria-label', 'Copy result');
        copyBtn.appendChild(this.createCopySvg(14));

        copyBtn.addEventListener('click', () => {
            const rawValue = resultFormat.replace(/[%,]/g, '');
            if (rawValue) {
                navigator.clipboard.writeText(rawValue).then(() => {
                    this.showToast('Copied to clipboard!');
                }).catch(() => {
                    this.showToast('Copy failed');
                });
            }
        });

        actionsDiv.appendChild(useBtn);
        actionsDiv.appendChild(copyBtn);
        return actionsDiv;
    }

    clearAuditTape() {
        if (this.auditList) this.auditList.textContent = '';
    }

    setCalcMode(mode) {
        const sidebar = document.getElementById('sidebar');
        const btnStd = document.getElementById('btn-mode-std');
        const btnSci = document.getElementById('btn-mode-sci');
        const sciContainer = document.getElementById('sci-container');

        if (mode === 'scientific') {
            this.activateScientificMode(sidebar, btnStd, btnSci, sciContainer);
        } else {
            const leftPanel = document.querySelector('.left-panel');
            if (leftPanel) leftPanel.style.overflow = 'hidden';
            if (leftPanel) void leftPanel.offsetWidth;

            requestAnimationFrame(() => {
                document.body.classList.remove('scientific-mode');
                // Update Store (REQ-ARCH-01) inside the frame to ensure layout has started settling
                store.state.persistent.mode = mode;

                if (sciContainer) sciContainer.classList.remove('active');
                if (sidebar) sidebar.classList.remove('scientific-active');
                if (btnSci) {
                    btnSci.classList.remove('active');
                    btnSci.setAttribute('aria-checked', 'false');
                }
                if (btnStd) {
                    btnStd.classList.add('active');
                    btnStd.setAttribute('aria-checked', 'true');
                }

                if (leftPanel) {
                    const cleanup = (e) => {
                        if (e && e.propertyName !== 'opacity' && e.propertyName !== 'width' && e.propertyName !== 'flex-basis') return;
                        leftPanel.style.overflow = '';
                        leftPanel.removeEventListener('transitionend', cleanup);
                        // Final sync after transition ends
                        if (this.webglRenderer) this.webglRenderer.render();
                    };
                    leftPanel.addEventListener('transitionend', cleanup);
                }

                // Initial sync for the start of the frame
                if (this.webglRenderer) this.webglRenderer.render();
            });
        }
    }

    async activateScientificMode(sidebar, btnStd, btnSci, sciContainer) {
        const leftPanel = document.querySelector('.left-panel');
        if (leftPanel) leftPanel.style.overflow = 'hidden';

        if (!window.MathfieldElement) {
            this.showToast('Loading Scientific Engine...');
            try {
                const { MathfieldElement } = await import('mathlive');
                MathfieldElement.fontsDirectory = './fonts/';
                await customElements.whenDefined('math-field');
            } catch (err) {
                console.error('Failed to load MathLive', err);
                this.showToast('Error loading scientific engine');
                return;
            }
        }

        if (leftPanel) void leftPanel.offsetWidth;
        requestAnimationFrame(() => {
            document.body.classList.add('scientific-mode');
            // Update Store (REQ-ARCH-01) inside the frame to ensure consistency with layout state
            store.state.persistent.mode = 'scientific';

            if (sidebar) sidebar.classList.add('scientific-active');
            if (btnStd) {
                btnStd.classList.remove('active');
                btnStd.setAttribute('aria-checked', 'false');
            }
            if (btnSci) {
                btnSci.classList.add('active');
                btnSci.setAttribute('aria-checked', 'true');
            }
            if (sciContainer) sciContainer.classList.add('active');

            // Add a default row if none exist
            const wrapper = document.querySelector('.sci-rows-wrapper');
            if (wrapper && wrapper.children.length === 0) {
                this.addScientificRow();
            }

            // Initial sync for scientific mode layout shift
            if (this.webglRenderer) this.webglRenderer.render();
        });

        // Add final sync after transition
        if (sidebar) {
            const cleanup = (e) => {
                if (e.propertyName === 'transform' || e.propertyName === 'width') {
                    if (this.webglRenderer) this.webglRenderer.render();
                    sidebar.removeEventListener('transitionend', cleanup);
                }
            };
            sidebar.addEventListener('transitionend', cleanup);
        }
    }

    addScientificRow(initialValue = '') {
        const wrapper = document.querySelector('.sci-rows-wrapper');
        if (!wrapper) return;

        const row = document.createElement('div');
        row.className = 'math-row';

        const uniqueId = 'math-res-' + crypto.randomUUID().slice(0, 8);
        const mf = this.createMathField();

        // Use mount event for stable restoration as per Phase 06 Research
        if (initialValue) {
            mf.addEventListener('mount', () => {
                mf.setValue(initialValue);
                // Trigger input to update result
                mf.dispatchEvent(new Event('input', { bubbles: true }));
            }, { once: true });
        }

        const actionsDiv = this.createMathActions(uniqueId, row);

        row.appendChild(mf);
        row.appendChild(actionsDiv);

        row.classList.add('row-enter');
        wrapper.appendChild(row);

        void row.offsetWidth;
        requestAnimationFrame(() => {
            row.style.maxHeight = row.scrollHeight + 'px';
            row.classList.remove('row-enter');

            row.addEventListener('transitionend', function handler(e) {
                if (e.propertyName === 'max-height') {
                    row.style.maxHeight = '';
                    row.removeEventListener('transitionend', handler);
                }
            }, { once: true });

            if (row.scrollHeight === 0) {
                row.style.maxHeight = '';
            }
        });

        const resEl = document.getElementById(uniqueId);
        if (resEl) this.setupMathFieldListeners(mf, resEl);
        mf.focus();
    }

    createMathField() {
        const mf = document.createElement('math-field');
        mf.setAttribute('virtual-keyboard-mode', 'manual');
        mf.setAttribute('aria-label', 'Mathematical expression');
        mf.addEventListener('focus', () => {
            document.querySelectorAll('math-field').forEach(f => f.classList.remove('last-focused'));
            mf.classList.add('last-focused');
        });
        return mf;
    }

    createMathActions(uniqueId, rowEl) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'math-actions';

        const resEl = document.createElement('span');
        resEl.className = 'math-result';
        resEl.id = uniqueId;
        resEl.setAttribute('aria-live', 'polite');
        resEl.textContent = '= ';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'icon-btn';
        copyBtn.title = 'Copy Result';
        copyBtn.setAttribute('aria-label', 'Copy result');
        copyBtn.appendChild(this.createCopySvg(16));
        copyBtn.addEventListener('click', () => this.copyResult(uniqueId, null, true));

        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn delete-row-btn';
        delBtn.title = 'Delete';
        delBtn.setAttribute('aria-label', 'Delete row');

        const delSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        delSvg.setAttribute('width', '16');
        delSvg.setAttribute('height', '16');
        delSvg.setAttribute('aria-hidden', 'true');
        
        const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', './assets/sprites.svg#icon-delete');
        delSvg.appendChild(useEl);
        
        delBtn.appendChild(delSvg);
        delBtn.addEventListener('click', () => {
            rowEl.style.maxHeight = rowEl.scrollHeight + 'px';
            void rowEl.offsetWidth;

            requestAnimationFrame(() => {
                rowEl.classList.add('row-exit');
                const cleanup = () => rowEl.remove();
                rowEl.addEventListener('transitionend', (e) => {
                    if (e.propertyName === 'max-height') {
                        cleanup();
                    }
                }, { once: true });
                setTimeout(cleanup, 400);
            });
        });

        actionsDiv.appendChild(resEl);
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(delBtn);
        return actionsDiv;
    }

    setupMathFieldListeners(mf, resEl) {
        mf.addEventListener('input', () => {
            const expr = mf.getValue('ascii-math');
            if (!expr || expr.trim() === '') {
                resEl.textContent = '= ';
                return;
            }

            if (expr.length > this.MATH_EXPR_LIMIT) {
                resEl.textContent = '= ERR: TOO LONG';
                return;
            }

            const calculated = CalculatorService.evaluate(expr);
            if (calculated !== null) {
                resEl.textContent = '= ' + this.proFormatter.format(calculated);
            } else {
                resEl.textContent = '= ';
            }
        });
    }
}

export const uiManager = new UIManager();
