import { create, all } from 'mathjs/number';

const math = create(all, {
  predictable: true
});

// Disable high-risk functions (APP-L8)
const unsafe = ['import', 'createUnit', 'evaluate', 'parse', 'simplify'];
// We block these via AST traversal in evaluate() rather than disabling them 
// on the math instance itself, because the service needs math.parse to function.

/**
 * Secure Calculator Service
 * Handles math evaluation with restrictive security settings.
 */
export class CalculatorService {
    /**
     * Evaluates a math expression securely.
     * @param {string} expression - The math expression to evaluate.
     * @param {Object} scope - Optional scope for variables.
     * @returns {number|null} - The result of the evaluation or null on error.
     */
    static evaluate(expression, scope = {}) {
        if (!expression || typeof expression !== 'string' || expression.trim() === '') {
            return null;
        }

        try {
            // We use the top-level math.parse which we know is safe because we controlled its initialization
            // but we need to check the expression's internal nodes for calls to unsafe functions.
            const node = math.parse(expression);
            
            // Traverse AST to block AccessorNode (prototype pollution) and unsafe functions
            node.traverse((n) => {
                if (n.type === 'AccessorNode') {
                    throw new Error('AccessorNode (property access) is forbidden');
                }
                
                if (n.type === 'FunctionNode' && unsafe.includes(n.name)) {
                    throw new Error(`Function ${n.name} is disabled`);
                }
                
                if (n.type === 'SymbolNode' && unsafe.includes(n.name)) {
                    throw new Error(`Access to ${n.name} is disabled`);
                }
            });

            const result = node.evaluate(scope);
            
            if (typeof result === 'number') {
                return isFinite(result) ? result : null;
            }
            
            if (result && typeof result.valueOf === 'function') {
                const val = result.valueOf();
                return (typeof val === 'number' && isFinite(val)) ? val : null;
            }

            return null;
        } catch (error) {
            // Security violations or evaluation errors return null
            return null;
        }
    }

    /**
     * Specialized row evaluation for percentage cards.
     * @param {string} type - Row type (type1, type2, type3, type4).
     * @param {number} x - First value.
     * @param {number} y - Second value.
     * @returns {number|string|null} - The result of the percentage calculation.
     */
    static calculatePercentage(type, x, y) {
        if (x === null || y === null || isNaN(x) || isNaN(y)) {
            return null;
        }

        switch (type) {
            case 'type1': // X is what % of Y
                return y !== 0 ? (x / y) * 100 : 'Error';
            case 'type2': // What is X% of Y
                return (x / 100) * y;
            case 'type3': // Change from X to Y
                if (x === 0) return 'Error';
                return ((y - x) / Math.abs(x)) * 100;
            case 'type4': // X is Y% of what?
                return y !== 0 ? x / (y / 100) : 'Error';
            default:
                return null;
        }
    }
}
