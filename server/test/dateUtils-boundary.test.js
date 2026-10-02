import assert from 'node:assert/strict';
import test from 'node:test';
import { dayKey, isValidDayKey } from '../src/utils/dateUtils.js';

test('dayKey crosses UTC and Asia/Kolkata date boundaries correctly', () => {
  const instant = new Date('2026-01-01T23:00:00.000Z');
  assert.equal(dayKey(instant, 'UTC'), '2026-01-01');
  assert.equal(dayKey(instant, 'Asia/Kolkata'), '2026-01-02');
});

test('dayKey validates real calendar dates', () => {
  assert.equal(isValidDayKey('2026-02-30'), false);
  assert.equal(isValidDayKey('2024-02-29'), true);
});
