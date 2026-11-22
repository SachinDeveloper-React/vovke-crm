import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bootStateTone, failureText, providerLabel, verdictTone } from './attestation.ts';

test('names each proof the way support reads it', () => {
  assert.equal(providerLabel('app_attest'), 'Apple App Attest');
  assert.equal(providerLabel('key_attestation'), 'Google key attestation');
  assert.equal(providerLabel('play_integrity'), 'Play Integrity');
  assert.equal(providerLabel(null), '—');
  assert.equal(providerLabel('something_new'), 'something_new');
});

test('an attested key reads green, an unattested one amber, a refusal red', () => {
  // A Keystore key's record says `attested`, not `pass` — it used to read red.
  assert.equal(verdictTone('attested'), 'success');
  assert.equal(verdictTone('pass'), 'success');
  assert.equal(verdictTone('unattested'), 'warning');
  assert.equal(verdictTone('refused'), 'error');
  assert.equal(verdictTone('fail'), 'error');
  assert.equal(verdictTone(undefined), 'default');
});

test('says why an iPhone was kept unattested, and falls back to the code for anything new', () => {
  assert.match(failureText('app_attest_unavailable') ?? '', /simulator/);
  assert.match(failureText('app_attest_not_configured') ?? '', /team id/);
  assert.equal(failureText('a_new_reason'), 'a new reason');
  assert.equal(failureText(null), null);
});

test('only a verified, locked boot is green', () => {
  assert.equal(bootStateTone('verified', true), 'success');
  assert.equal(bootStateTone('verified', false), 'error');
  assert.equal(bootStateTone('unverified', true), 'error');
  assert.equal(bootStateTone(null, null), 'default');
});
