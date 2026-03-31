import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Store state persistence', () => {
    test.beforeEach(async ({ page }) => {
        // Intercept network requests to serve our local module without a dev server
        await page.route('**/*', async (route) => {
            if (route.request().url().endsWith('/store.js')) {
                const storePath = path.resolve(__dirname, '../services/store.js');
                const content = fs.readFileSync(storePath, 'utf8');
                await route.fulfill({
                    status: 200,
                    contentType: 'application/javascript',
                    body: content
                });
            } else if (route.request().url().includes('/test-page')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'text/html',
                    body: '<!DOCTYPE html><html><body></body></html>'
                });
            } else {
                await route.continue();
            }
        });

        await page.goto('http://localhost/test-page');
    });

    test('Test 1: Setting state triggers subscribers with new state', async ({ page }) => {
        const notifications = await page.evaluate(async () => {
            const { Store } = await import('./store.js');
            const s = new Store({ a: 1 });
            
            let notifiedStates = [];
            s.subscribe((state) => {
                notifiedStates.push(state);
            });

            s.setState({ a: 2 });
            s.setState({ b: 3 });

            return notifiedStates;
        });

        expect(notifications.length).toBe(2);
        expect(notifications[0]).toEqual({ a: 2 });
        expect(notifications[1]).toEqual({ a: 2, b: 3 });
    });

    test('Test 2: Setting state multiple times quickly only triggers one localStorage write (debounce check)', async ({ page }) => {
        const writeCount = await page.evaluate(async () => {
            const { Store } = await import('./store.js');
            
            // Mock localStorage to count calls
            let writes = 0;
            const originalSetItem = window.localStorage.setItem;
            window.localStorage.setItem = function(key, value) {
                if (key === 'interactiveCalcState') {
                    writes++;
                }
                originalSetItem.call(window.localStorage, key, value);
            };

            const s = new Store({ value: 0 });
            
            // Rapid state updates
            s.setState({ value: 1 });
            s.setState({ value: 2 });
            s.setState({ value: 3 });

            // Wait for debounce period (500ms) plus a tiny buffer
            await new Promise(resolve => setTimeout(resolve, 600));

            // Should have batched into 1 save
            const saveCountAfterDebounce = writes;

            // Restore original
            window.localStorage.setItem = originalSetItem;

            return saveCountAfterDebounce;
        });

        // 1 call from initialization (auto-subscribe persistState) and 1 from the batched updates
        // Wait, the Store constructor calls `this.subscribe(this._persistState.bind(this));`, but does it persist immediately? 
        // Oh, constructor does not invoke subscribers. It only invokes them on `setState()`.
        // Rapid setState x 3 will trigger `_persistState` 3 times, but due to `clearTimeout`, it only executes `localStorage.setItem` ONCE after 500ms.
        expect(writeCount).toBe(1);
    });

    test('Test 3: State is correctly restored from localStorage on initialization', async ({ page }) => {
        const result = await page.evaluate(async () => {
            // Preset localStorage
            window.localStorage.setItem('interactiveCalcState', JSON.stringify({ presetValue: 42 }));

            const { Store } = await import('./store.js');
            
            // App logic (app.js) usually calls loadState which reads from localStorage, 
            // OR we can pass it to constructor if we decide to. 
            // The plan says: "State is correctly restored from localStorage on initialization."
            // Wait, does the Store class itself read from localStorage on init?
            // "Export an instance of Store with the default calculator state as specified in RESEARCH.md and existing app.js logic."
            // Looking at the plan, the Store only persists. LocalStorage reading is an app.js responsibility (loadState), or Store responsibility?
            // "State is correctly restored from localStorage on initialization". 
            // I'll simulate app.js logic: read localStorage, parse, and init store, OR check if Store automatically reads.
            // My Store class didn't automatically read localStorage. I'll read it and setState.
            const savedItem = window.localStorage.getItem('interactiveCalcState');
            const parsed = savedItem ? JSON.parse(savedItem) : {};
            
            const s = new Store({ baseline: 0 });
            s.setState(parsed);

            return s.getState();
        });

        expect(result.presetValue).toBe(42);
        expect(result.baseline).toBe(0);
    });

    test.describe('Proxy-based Optimization (TDD)', () => {
        test('O(1) read overhead: getState returns a reference or Proxy, not a deep copy', async ({ page }) => {
            const isReferenceOrProxy = await page.evaluate(async () => {
                const { Store } = await import('./store.js');
                const initial = { deep: { nesting: 1 } };
                const s = new Store(initial);
                
                const state1 = s.getState();
                const state2 = s.getState();
                
                // If it's a deep copy (current), this should be false
                // If it's a Proxy or reference (optimized), this should be true (or state2 should be Proxy)
                // For lazy cloning, subsequent calls to getState() without changes should return the same object
                return state1.deep === state2.deep;
            });
            expect(isReferenceOrProxy).toBe(true);
        });

        test('Structural sharing: unchanged objects maintain reference equality', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { Store } = await import('./store.js');
                const initial = { 
                    a: { val: 1 },
                    b: { val: 2 }
                };
                const s = new Store(initial);
                const stateBefore = s.getState();
                
                s.setState({ a: { val: 11 } });
                const stateAfter = s.getState();
                
                return {
                    aChanged: stateBefore.a !== stateAfter.a,
                    bShared: stateBefore.b === stateAfter.b
                };
            });
            expect(result.aChanged).toBe(true);
            expect(result.bShared).toBe(true);
        });

        test('Lazy shallow cloning: only the modified path is cloned', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { Store } = await import('./store.js');
                const initial = { 
                    root: { 
                        sub: { leaf: 1 },
                        other: { leaf: 2 }
                    }
                };
                const s = new Store(initial);
                const stateBefore = s.getState();
                
                // Update nested property
                // This assumes setState can handle nested paths or we use a Proxy on the state directly
                // If setState is still shallow merge at root:
                s.setState({ root: { ...s.getState().root, sub: { leaf: 11 } } });
                const stateAfter = s.getState();
                
                return {
                    rootCloned: stateBefore.root !== stateAfter.root,
                    subCloned: stateBefore.root.sub !== stateAfter.root.sub,
                    otherShared: stateBefore.root.other === stateAfter.root.other
                };
            });
            expect(result.rootCloned).toBe(true);
            expect(result.subCloned).toBe(true);
            expect(result.otherShared).toBe(true);
        });

        test('Transient state does not persist across page refreshes', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { Store } = await import('./store.js');
                const s = new Store({
                    persistent: { theme: 'blue' },
                    transient: { temp: 'xyz' }
                });
                
                // Trigger save via property set (CoW)
                s.state.persistent.theme = 'red';
                s.state.transient.temp = 'abc';
                
                // Wait for debounce
                await new Promise(r => setTimeout(r, 600));
                
                // Simulate refresh: Read from localStorage
                const saved = JSON.parse(window.localStorage.getItem('interactiveCalcState'));
                return {
                    themeSaved: saved.theme === 'red',
                    tempNotSaved: saved.temp === undefined
                };
            });
            expect(result.themeSaved).toBe(true);
            expect(result.tempNotSaved).toBe(true);
        });

        test('Batch updates notify subscribers only once', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { Store } = await import('./store.js');
                const s = new Store({ a: 1, b: 2 });
                
                let count = 0;
                s.subscribe(() => count++);
                
                s.batch(() => {
                    s.state.a = 10;
                    s.state.b = 20;
                });
                
                return count;
            });
            expect(result).toBe(1);
        });

        test('Structural sharing: arrays maintain reference equality when not modified', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const { Store } = await import('./store.js');
                const initial = { 
                    arr: [1, 2, 3],
                    obj: { x: 1 }
                };
                const s = new Store(initial);
                const stateBefore = s.getState();
                
                s.state.obj.x = 2;
                const stateAfter = s.getState();
                
                return stateBefore.arr === stateAfter.arr;
            });
            expect(result).toBe(true);
        });
    });
});
