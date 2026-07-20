import { describe, it, expect } from 'vitest';
import { ClipboardManager } from './clipboard-manager.js';

describe('ClipboardManager - translateToExcelFormula', () => {
  const clipboard = new ClipboardManager({ showToast: () => {} });

  it('should translate empty and null expressions to empty string', () => {
    expect(clipboard.translateToExcelFormula('')).toBe('');
    expect(clipboard.translateToExcelFormula(null)).toBe('');
  });

  it('should prefix expression with equals sign', () => {
    expect(clipboard.translateToExcelFormula('10 + 20')).toBe('=10 + 20');
  });

  it('should not add double equals sign if already present', () => {
    expect(clipboard.translateToExcelFormula('=10 + 20')).toBe('=10 + 20');
  });

  it('should capitalize standard mathematical functions', () => {
    expect(clipboard.translateToExcelFormula('sin(pi * 2) + sqrt(16)')).toBe(
      '=SIN(PI() * 2) + SQRT(16)'
    );
    expect(clipboard.translateToExcelFormula('cos(tan(0.5))')).toBe(
      '=COS(TAN(0.5))'
    );
  });

  it('should map mathematical constants correctly', () => {
    expect(clipboard.translateToExcelFormula('pi')).toBe('=PI()');
    expect(clipboard.translateToExcelFormula('e')).toBe('=EXP(1)');
    expect(clipboard.translateToExcelFormula('pi * e')).toBe('=PI() * EXP(1)');
  });
});
