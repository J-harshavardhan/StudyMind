import { describe, expect, it } from 'vitest';
import { monthGrid } from './dateKeys';

describe('date key helpers', () => {
  it('starts grids on Monday for each weekday', () => {
    for (let month = 1; month <= 12; month += 1) {
      const grid = monthGrid(2026, month);
      expect(grid.filter(Boolean)[0]).toMatch(/^2026-/);
      expect(grid.length % 7).toBe(0);
    }
  });
  it('handles leap February', () => {
    expect(monthGrid(2024, 2).filter(Boolean)).toHaveLength(29);
  });
  it('handles year boundaries without date shifting', () => {
    expect(monthGrid(2025, 12).filter(Boolean).at(-1)).toBe('2025-12-31');
    expect(monthGrid(2026, 1).filter(Boolean)[0]).toBe('2026-01-01');
  });
});
