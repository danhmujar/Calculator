import { create, all, MathNode } from 'mathjs';

const math = create(all, {
  predictable: true,
});

// Enable implicit multiplication (e.g., 2x -> 2*x)
math.config({ implicit: 'multiply' });

// Disable high-risk functions (APP-L8)
const unsafe: string[] = [
  'import',
  'createUnit',
  'evaluate',
  'parse',
  'simplify',
];

/**
 * Secure Calculator Service
 * Handles math evaluation with restrictive security settings.
 */
export class CalculatorService {
  /**
   * Evaluates a math expression securely.
   * @param {string | null} expression - The math expression to evaluate.
   * @param {Record<string, any>} scope - Optional scope for variables.
   * @returns {number | null} - The result of the evaluation or null on error.
   */
  static evaluate(
    expression: string | null,
    scope: Record<string, any> = {}
  ): number | null {
    if (
      !expression ||
      typeof expression !== 'string' ||
      expression.trim() === ''
    ) {
      return null;
    }

    try {
      const node: MathNode = math.parse(expression);

      // Traverse AST to block AccessorNode (prototype pollution) and unsafe functions
      node.traverse((n: any) => {
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

      if (result && typeof (result as any).valueOf === 'function') {
        const val = (result as any).valueOf();
        return typeof val === 'number' && isFinite(val) ? val : null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Specialized row evaluation for percentage cards.
   */
  static calculatePercentage(
    type: string,
    x: number | null,
    y: number | null
  ): number | string | null {
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
