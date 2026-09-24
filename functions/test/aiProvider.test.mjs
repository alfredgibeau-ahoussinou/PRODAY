import test from 'node:test';
import assert from 'node:assert/strict';
import { GEMINI_DEFAULT_MODEL } from '../lib/aiProvider.js';

test('aiProvider — GEMINI_DEFAULT_MODEL constant', () => {
  assert.equal(GEMINI_DEFAULT_MODEL, 'gemini-3.6-flash');
});
