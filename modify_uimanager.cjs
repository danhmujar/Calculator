const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ui/uimanager.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Remove toggleParityMode shortcut
code = code.replace(`            // Parity Mode Toggle (REQ-VER-01)
            if (e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.toggleParityMode();
            }`, `// Parity mode removed`);

// 2. Remove toggleParityMode method
code = code.replace(/    \/\*\*\n     \* Toggles between WebGL-Only, Split-View, and Legacy-Only rendering modes \(REQ-VER-01\)\.\n     \*\/\n    toggleParityMode\(\) \{[\s\S]*?\n    \}/, '');

// 3. Update init() for WebGL permanently
const initOld = `        // Initialize WebGL Underlay (REQ-WGL-01)
        this.webgl = new WebGLContext();
        this.webglRenderer = new WebGLRenderer(this.webgl, this.typography);
        const layoutContainer = document.querySelector('.layout-container');
        if (layoutContainer && this.webgl.canvas) {
            layoutContainer.prepend(this.webgl.canvas);
            
            // Handle WebGL Toggle (REQ-WGL-04)
            this.setupWebGLToggle();
            
            // Initial sync for verification (avoids conflict with syncThemeColors)
            renderer.schedule(() => {
                if (document.body.classList.contains('webgl-active')) {
                    this.webglRenderer.render();
                }
            });`;

const initNew = `        // Initialize WebGL Underlay (REQ-WGL-01)
        this.webgl = new WebGLContext();
        this.webglRenderer = new WebGLRenderer(this.webgl, this.typography);
        const layoutContainer = document.querySelector('.layout-container');
        if (layoutContainer && this.webgl.canvas) {
            layoutContainer.prepend(this.webgl.canvas);
            
            // Permanently enable Ghost DOM + WebGL Overlay
            document.body.classList.add('webgl-active', 'ghost-mode');
            this.webgl.canvas.style.zIndex = '1';
            this.webgl.canvas.style.pointerEvents = 'none';
            this.webgl.canvas.style.display = 'block';
            
            // Initial sync for verification
            renderer.schedule(() => {
                this.webglRenderer.render();
            });`;

code = code.replace(initOld, initNew);

// 4. Remove setupWebGLToggle method
code = code.replace(/    setupWebGLToggle\(\) \{[\s\S]*?updateWebGLState\(webglEnabled\);\n    \}/, '');

// 5. Remove fitDisplayText method entirely
code = code.replace(/    fitDisplayText\(text\) \{[\s\S]*?this\.displayEl\.style\.fontSize = res\.fontSizeRem \+ 'rem';\n    \}/, '');

// 6. Fix updateDisplay
const updateDisplayOld = `    updateDisplay(calcState, formatOperator) {
        renderer.schedule(() => {
            if (!this.displayEl || !this.previewEl) return;

            let hasDot = calcState.currentValue.endsWith('.');
            let targetVal = parseFloat(calcState.currentValue);
            if (isNaN(targetVal)) targetVal = 0;

            let formatted = this.proFormatter.format(targetVal);
            if (hasDot) formatted += '.';

            this.fitDisplayText(formatted);`;

const updateDisplayNew = `    updateDisplay(calcState, formatOperator) {
        renderer.schedule(() => {
            if (!this.displayEl || !this.previewEl) return;

            let hasDot = calcState.currentValue.endsWith('.');
            let targetVal = parseFloat(calcState.currentValue);
            if (isNaN(targetVal)) targetVal = 0;

            let formatted = this.proFormatter.format(targetVal);
            if (hasDot) formatted += '.';
            
            // Fallback for huge numbers if needed, but WebGL scales text to fit.
            if (formatted.length > 15 && targetVal > 0) {
               formatted = targetVal.toExponential(4);
            }

            this.displayEl.textContent = formatted;`;
            
code = code.replace(updateDisplayOld, updateDisplayNew);

// 7. Remove ResizeObserver block dealing with this.fitDisplayText
code = code.replace(/        \/\/ REQ-UI-06: Robust text fitting via ResizeObserver to handle side-panel transitions and resizer handle\.[\s\S]*?ro\.observe\(displayContainer\);\n            \}\n        \}/, '');

fs.writeFileSync(filePath, code);
console.log('Modified ui/uimanager.js successfully');
