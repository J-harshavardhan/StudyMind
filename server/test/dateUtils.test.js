import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays, dayKey, isValidDayKey, monthRange } from '../src/utils/dateUtils.js';

test('dayKey respects timezone boundaries', () => {
  assert.equal(dayKey(new Date('2025-01-01T00:30:00.000Z'), 'America/Los_Angeles'), '2024-12-31');
});
test('date utilities handle leap days', () => {
  assert.equal(isValidDayKey('2024-02-29'), true);
  assert.equal(addDays('2024-02-29', 1), '2024-03-01');
  assert.deepEqual(monthRange('2024-02'), { start: '2024-02-01', end: '2024-02-29' });
});
test('date utilities reject invalid values', () => {
  assert.equal(isValidDayKey('2023-02-29'), false);
  assert.throws(() => monthRange('2024-13'));
  assert.throws(() => addDays('not-a-day', 1));
});
