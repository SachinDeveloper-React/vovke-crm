import assert from 'node:assert/strict';
import { test } from 'node:test';

import { modeSource, moneyOff, needsGateway } from './payment-mode.ts';

/**
 * No payment gateway, no money products (D-109): the panel offers the two
 * money modes disabled, and says where a mode in force comes from when the
 * product's own setting is being overridden.
 */

test('only an API that says there is no gateway turns the money modes off', () => {
  assert.equal(moneyOff({ moneyPayments: false }), true);
  assert.equal(moneyOff({ moneyPayments: true }), false);
  // An API from before the flag took money, and is read that way.
  assert.equal(moneyOff({}), false);
});

test('money and mixed need a gateway; coins and the shop’s mode do not', () => {
  assert.deepEqual(['', 'coins', 'money', 'mixed'].map(needsGateway), [false, false, true, true]);
});

test('says when a product set to money is being sold for coins', () => {
  assert.equal(modeSource({ paymentMode: 'money', effectivePaymentMode: 'coins' }), 'set to money · no payment gateway');
  assert.equal(modeSource({ paymentMode: 'mixed', effectivePaymentMode: 'coins' }), 'set to mixed · no payment gateway');
  assert.equal(modeSource({ paymentMode: 'coins', effectivePaymentMode: 'coins' }), 'its own');
  assert.equal(modeSource({ paymentMode: 'money', effectivePaymentMode: 'money' }), 'its own');
  assert.equal(modeSource({ paymentMode: null, effectivePaymentMode: 'coins' }), 'the shop’s');
});
