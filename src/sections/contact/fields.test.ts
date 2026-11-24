import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CONTACT_GROUPS, labelled, normalisePhone, normaliseUrl, planSave, readField, showField } from './fields.ts';

const field = (path: string) => CONTACT_GROUPS.flatMap(group => group.fields).find(entry => entry.path === path)!;
const group = (id: string) => CONTACT_GROUPS.find(entry => entry.id === id)!;

test('a phone number typed the way people read it becomes +digits', () => {
  assert.equal(normalisePhone('98765 43210'), '+919876543210');
  assert.equal(normalisePhone('098765-43210'), '+919876543210');
  assert.equal(normalisePhone('+91 98765-43210'), '+919876543210');
  assert.equal(normalisePhone('91 98765 43210'), '+919876543210');
  assert.equal(normalisePhone('(+44) 20 7946 0958'), '+442079460958');
  assert.equal(normalisePhone('+44 20 7946 0958'), '+442079460958');
  assert.equal(normalisePhone('0044 20 7946 0958'), '+442079460958');
  // Not a number at all: left for the API to refuse in words.
  assert.equal(normalisePhone('call us'), 'call us');
  assert.equal(normalisePhone('  '), '');
});

test('a link typed without https:// gets it; one with another scheme is left for the API', () => {
  assert.equal(normaliseUrl('vokve.com/privacy'), 'https://vokve.com/privacy');
  assert.equal(normaliseUrl('https://vokve.com'), 'https://vokve.com');
  assert.equal(normaliseUrl('http://vokve.com'), 'http://vokve.com');
  assert.equal(normaliseUrl(''), '');
});

test('each kind of box reads back as the value its key holds', () => {
  assert.equal(readField(field('support.phone'), ''), null);
  assert.equal(readField(field('support.email'), ''), '');
  assert.equal(readField(field('support.email'), ' help@vokve.com '), 'help@vokve.com');
  assert.deepEqual(readField(field('support.address'), 'VOKVE Fitness\n\n  Jaipur, Rajasthan \r\nIndia'), [
    'VOKVE Fitness',
    'Jaipur, Rajasthan',
    'India',
  ]);
  assert.equal(readField(field('app.storeListed.ios'), 'on'), true);
  assert.equal(readField(field('app.storeListed.ios'), null), false);
  assert.equal(showField(field('support.address'), ['A', 'B']), 'A\nB');
  assert.equal(showField(field('support.whatsapp'), null), '');
});

test('saving sends only what moved, and a value typed back to the default as a reset', () => {
  const current: Record<string, unknown> = {
    'support.email': 'support@vokve.app',
    'support.phone': '+918000000000',
    'support.whatsapp': null,
    'support.hours': 'Mon–Sat, 9 am – 7 pm IST',
    'support.responseTime': 'We usually reply within 24 hours.',
  };
  const shipped: Record<string, unknown> = { ...current, 'support.email': 'support@vokve.com' };
  const typed: Record<string, string> = {
    'support.email': 'support@vokve.com', // back to the default → reset
    'support.phone': '98765 43210', // changed → set, normalised
    'support.whatsapp': '', // still empty → nothing
    'support.hours': 'Mon–Sat, 9 am – 7 pm IST', // as it was → nothing
    'support.responseTime': 'We usually reply within 24 hours.',
  };
  const plan = planSave(group('reach'), path => typed[path] ?? null, path => current[path], path => shipped[path]);
  assert.deepEqual(plan.set, { 'support.phone': '+919876543210' });
  assert.deepEqual(plan.reset, ['support.email']);
  assert.deepEqual(plan.changed.map(entry => entry.path), ['support.email', 'support.phone']);
});

test('a refusal names the box by its label', () => {
  assert.equal(
    labelled('support.phone: A number in international form · support.links.privacy: A full https:// address'),
    'Support phone: A number in international form · Privacy policy: A full https:// address',
  );
});

test('every box is a key the API knows to check', () => {
  const paths = CONTACT_GROUPS.flatMap(entry => entry.fields.map(f => f.path));
  assert.equal(new Set(paths).size, paths.length, 'a key appears twice');
  for (const path of paths) assert.match(path, /^(support|app|commerce)\./);
});
