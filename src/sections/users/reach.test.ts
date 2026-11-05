import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Install } from '../../lib/types.ts';
import { reachOf } from './reach.ts';

/**
 * What the panel is allowed to claim about a phone it cannot see.
 *
 * The order of these checks is the whole of the logic: an install that is
 * signed out cannot be asked whatever its push token says, and a token the
 * provider has already refused is not reachable however recently the app was
 * open. Each test below is one of those precedences, because getting them the
 * wrong way round produces the one failure that matters — a row that reads
 * "app in use" beside a phone nothing can reach.
 */

const NOW = Date.parse('2026-11-04T10:00:00.000Z');

const install = (over: Partial<Install> = {}): Install =>
  ({
    deviceId: 'd-1',
    platform: 'android',
    device: { brand: 'Pixel', model: '7a', manufacturer: 'Google' },
    app: { version: '1.4.0', build: '140', firstVersion: '1.0.0', bundleId: 'app.vokve' },
    installedAt: '2026-01-01T00:00:00.000Z',
    lastActiveAt: new Date(NOW - 60_000).toISOString(),
    revokedAt: null,
    signedIn: true,
    push: { hasToken: true, updatedAt: null, invalidAt: null },
    ...over,
  }) as unknown as Install;

test('a phone heard from minutes ago is reported as in use', () => {
  const reach = reachOf(install(), NOW);
  assert.equal(reach.word, 'app in use');
  assert.equal(reach.tone, 'success');
  assert.equal(reach.askable, true);
});

test('silence is reported as silence, not as being offline', () => {
  const quiet = reachOf(install({ lastActiveAt: new Date(NOW - 7_200_000).toISOString() }), NOW);
  assert.equal(quiet.word, 'quiet');
  // Still askable: a quiet phone may well answer. The server does not know
  // whether it has a network, and must not say that it does not.
  assert.equal(quiet.askable, true);
  assert.doesNotMatch(quiet.why, /offline\b(?!.*force)/i);
});

test('signed out beats everything under it', () => {
  const out = reachOf(install({ signedIn: false }), NOW);
  assert.equal(out.word, 'signed out');
  assert.equal(out.askable, false);
});

test('a token the provider refused is not reachable, however fresh the heartbeat', () => {
  const dead = reachOf(install({ push: { hasToken: true, updatedAt: null, invalidAt: '2026-11-01T00:00:00.000Z' } }), NOW);
  assert.equal(dead.word, 'token rejected');
  assert.equal(dead.askable, false);
});

test('no token at all is its own answer', () => {
  const none = reachOf(install({ push: { hasToken: false, updatedAt: null, invalidAt: null } }), NOW);
  assert.equal(none.word, 'cannot be reached');
  assert.equal(none.askable, false);
});

test('a revoked install is never asked', () => {
  const gone = reachOf(install({ revokedAt: '2026-10-01T00:00:00.000Z' }), NOW);
  assert.equal(gone.word, 'revoked');
  assert.equal(gone.askable, false);
});

test('an install that has never made a request says so rather than guessing', () => {
  const new_ = reachOf(install({ lastActiveAt: null }), NOW);
  assert.equal(new_.word, 'never heard from');
  assert.equal(new_.askable, true);
});
