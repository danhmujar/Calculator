import { describe, it, expect } from 'vitest';
import { CalculatorService } from './calculator.ts';

describe('CalculatorService', () => {
  describe('evaluate', () => {
    it('should evaluate simple arithmetic', () => {
      expect(CalculatorService.evaluate('2 + 2')).toBe(4);
      expect(CalculatorService.evaluate('10 - 5')).toBe(5);
      expect(CalculatorService.evaluate('3 * 4')).toBe(12);
      expect(CalculatorService.evaluate('20 / 4')).toBe(5);
    });

    it('should handle operator precedence', () => {
      expect(CalculatorService.evaluate('2 + 3 * 4')).toBe(14);
      expect(CalculatorService.evaluate('(2 + 3) * 4')).toBe(20);
    });

    it('should handle implicit multiplication', () => {
      // mathjs configured with implicit: 'multiply'
      expect(CalculatorService.evaluate('2(3 + 4)')).toBe(14);
    });

    it('should handle decimals', () => {
      expect(CalculatorService.evaluate('0.1 + 0.2')).toBeCloseTo(0.3);
    });

    it('should return null for invalid expressions', () => {
      expect(CalculatorService.evaluate('2 +')).toBeNull();
      expect(CalculatorService.evaluate('abc')).toBeNull();
      expect(CalculatorService.evaluate('')).toBeNull();
      expect(CalculatorService.evaluate(null)).toBeNull();
    });

    it('should block unsafe functions (Security)', () => {
      expect(CalculatorService.evaluate('evaluate("2+2")')).toBeNull();
      expect(CalculatorService.evaluate('import("fs")')).toBeNull();
      expect(CalculatorService.evaluate('simplify("2x + x")')).toBeNull();
    });

    it('should block property access (Prototype Pollution Protection)', () => {
      expect(CalculatorService.evaluate('constructor')).toBeNull();
      expect(CalculatorService.evaluate('obj.prop')).toBeNull();
    });

    it('should handle division by zero by returning null (isFinite check)', () => {
      expect(CalculatorService.evaluate('1 / 0')).toBeNull();
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate "X is what % of Y" (type1)', () => {
      expect(CalculatorService.calculatePercentage('type1', 20, 100)).toBe(20);
      expect(CalculatorService.calculatePercentage('type1', 50, 200)).toBe(25);
      expect(CalculatorService.calculatePercentage('type1', 10, 0)).toBe(
        'Error'
      );
    });

    it('should calculate "What is X% of Y" (type2)', () => {
      expect(CalculatorService.calculatePercentage('type2', 20, 100)).toBe(20);
      expect(CalculatorService.calculatePercentage('type2', 5, 200)).toBe(10);
    });

    it('should calculate "Percentage change from X to Y" (type3)', () => {
      expect(CalculatorService.calculatePercentage('type3', 100, 120)).toBe(20);
      expect(CalculatorService.calculatePercentage('type3', 100, 80)).toBe(-20);
      expect(CalculatorService.calculatePercentage('type3', 0, 50)).toBe(
        'Error'
      );
    });

    it('should calculate "X is Y% of what?" (type4)', () => {
      expect(CalculatorService.calculatePercentage('type4', 20, 10)).toBe(200);
      expect(CalculatorService.calculatePercentage('type4', 50, 0)).toBe(
        'Error'
      );
    });

    it('should return null for invalid inputs', () => {
      expect(
        CalculatorService.calculatePercentage('type1', null, 100)
      ).toBeNull();
      expect(
        CalculatorService.calculatePercentage('type2', 20, NaN)
      ).toBeNull();
      expect(
        CalculatorService.calculatePercentage('unknown', 10, 10)
      ).toBeNull();
    });
  });
});
