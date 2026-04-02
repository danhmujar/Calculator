import { test, expect } from '@playwright/test';

test.describe('Modular Services - Comprehensive Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Load the main app which has Vite serving the modules
        // Vite base is /Calculator/
        await page.goto('/Calculator/');
        // Wait for app to be ready
        await page.waitForSelector('canvas#webgl-underlay');
    });

    test('Store - State Initialization and Read', async ({ page }) => {
        const state = await page.evaluate(async () => {
            const { store } = await import('/Calculator/services/store.js');
            return store.getState();
        });
        
        expect(state).toHaveProperty('persistent');
        expect(state).toHaveProperty('transient');
        expect(state.transient.currentValue).toBe('0');
        expect(state.persistent.mode).toBe('standard');
    });

    test('Store - State Transitions (setState) and Proxied reactivity', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { Store } = await import('/Calculator/services/store.js');
            const testStore = new Store({
                persistent: { mode: 'standard' },
                transient: { currentValue: '0', operator: null }
            });
            
            let notifiedState = null;
            testStore.subscribe((s) => { notifiedState = s; });
            
            // Proxy write
            testStore.state.transient.currentValue = '42';
            
            // Batch update
            testStore.setState({
                transient: { ...testStore.state.transient, operator: '+' }
            });
            
            return {
                currentValue: testStore.getState().transient.currentValue,
                operator: testStore.getState().transient.operator,
                notifiedStateValue: notifiedState ? notifiedState.transient.currentValue : null
            };
        });
        
        expect(result.currentValue).toBe('42');
        expect(result.operator).toBe('+');
        expect(result.notifiedStateValue).toBe('42');
    });

    test('Store - Structural Sharing (Copy-on-Write)', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { Store } = await import('/Calculator/services/store.js');
            const initial = {
                branchA: { val: 1 },
                branchB: { val: 2 }
            };
            const testStore = new Store(initial);
            
            const originalBranchB = testStore.getState().branchB;
            
            testStore.state.branchA.val = 3;
            
            const newBranchB = testStore.getState().branchB;
            
            return {
                isSameReference: originalBranchB === newBranchB,
                valA: testStore.getState().branchA.val
            };
        });
        
        expect(result.isSameReference).toBe(true);
        expect(result.valA).toBe(3);
    });

    test('Calculator - Scientific Logic and Edge Cases', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('/Calculator/services/calculator.js');
            return {
                basic: CalculatorService.evaluate('2 + 3 * 4'),
                scientific: CalculatorService.evaluate('sin(pi/2) + sqrt(16)'),
                power: CalculatorService.evaluate('2^8'),
                implicitMultiplication: CalculatorService.evaluate('2(3+4)'),
                invalidSyntax: CalculatorService.evaluate('2 + * 3'),
                empty: CalculatorService.evaluate(''),
                nullInput: CalculatorService.evaluate(null),
                // Edge cases
                divisionByZero: CalculatorService.evaluate('10 / 0'),
                complexNesting: CalculatorService.evaluate('((2+3)*4)/(5-3)'),
                largeNumbers: CalculatorService.evaluate('1e10 * 1e10')
            };
        });
        
        expect(result.basic).toBe(14);
        expect(result.scientific).toBe(5);
        expect(result.power).toBe(256);
        expect(result.implicitMultiplication).toBe(14);
        expect(result.invalidSyntax).toBeNull();
        expect(result.empty).toBeNull();
        expect(result.nullInput).toBeNull();
        expect(result.divisionByZero).toBeNull(); // CalculatorService returns null for !isFinite
        expect(result.complexNesting).toBe(10);
        expect(result.largeNumbers).toBe(1e20);
    });

    test('Calculator - Percentage Logic', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('/Calculator/services/calculator.js');
            return {
                type1: CalculatorService.calculatePercentage('type1', 25, 100), // 25 is what % of 100
                type2: CalculatorService.calculatePercentage('type2', 20, 150), // 20% of 150
                type3: CalculatorService.calculatePercentage('type3', 50, 75),  // change from 50 to 75
                type4: CalculatorService.calculatePercentage('type4', 20, 10),  // 20 is 10% of what
                type1Zero: CalculatorService.calculatePercentage('type1', 10, 0),
                type3Zero: CalculatorService.calculatePercentage('type3', 0, 10),
                type4Zero: CalculatorService.calculatePercentage('type4', 20, 0),
                invalidX: CalculatorService.calculatePercentage('type1', null, 100),
                invalidY: CalculatorService.calculatePercentage('type2', 10, NaN)
            };
        });
        
        expect(result.type1).toBe(25);
        expect(result.type2).toBe(30);
        expect(result.type3).toBe(50);
        expect(result.type4).toBe(200);
        expect(result.type1Zero).toBe('Error');
        expect(result.type3Zero).toBe('Error');
        expect(result.type4Zero).toBe('Error');
        expect(result.invalidX).toBeNull();
        expect(result.invalidY).toBeNull();
    });

    test('Calculator - Security restrictions', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('/Calculator/services/calculator.js');
            return {
                evaluateCall: CalculatorService.evaluate('evaluate("1+1")'), // blocked function
                importCall: CalculatorService.evaluate('import("mathjs")'), // blocked function
                accessorNode: CalculatorService.evaluate('a.b', { a: { b: 1 } }), // blocked accessor
                prototypePollution: CalculatorService.evaluate('constructor.prototype.test = "pwned"')
            };
        });
        
        expect(result.evaluateCall).toBeNull();
        expect(result.importCall).toBeNull();
        expect(result.accessorNode).toBeNull();
        expect(result.prototypePollution).toBeNull();
    });

    test('EventManager - Callbacks Binding', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { EventManager } = await import('/Calculator/services/events.js');
            const history = [];
            
            const callbacks = {
                onDigit: (val) => { history.push({ action: 'digit', value: val }); },
                onOperation: (val) => { history.push({ action: 'operation', value: val }); },
                onAction: (val) => { history.push({ action: 'action', value: val }); },
                onEquals: () => { history.push({ action: 'equals' }); },
                onPercentage: () => { history.push({ action: 'percentage' }); },
                onMemory: (val) => { history.push({ action: 'memory', value: val }); },
                onClearAudit: () => { history.push({ action: 'clearAudit' }); },
                onTriggerSave: () => { history.push({ action: 'triggerSave' }); },
                onPaste: (val) => { history.push({ action: 'paste', value: val }); }
            };
            
            const em = new EventManager(callbacks);
            
            // Test the core logical mapping manually
            em.callbacks.onDigit('7');
            em.callbacks.onOperation('+');
            em.handlePaste('123.45');
            
            return history;
        });
        
        expect(result[0]).toEqual({ action: 'digit', value: '7' });
        expect(result[1]).toEqual({ action: 'operation', value: '+' });
        expect(result[2]).toEqual({ action: 'paste', value: '123.45' });
        expect(result[3]).toEqual({ action: 'triggerSave' });
    });
});
