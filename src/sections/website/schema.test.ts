import assert from 'node:assert/strict';
import { test } from 'node:test';

import { emptyOf, errorsUnder, fieldKind, labelFor, setIn, summaryOf, unwrapNullable, type JsonSchema } from './schema.ts';

// Shapes as `z.toJSONSchema(…, { io: 'input' })` writes them on the API.
const link: JsonSchema = {
  type: 'object',
  properties: { label: { type: 'string', minLength: 1 }, href: { type: 'string', widget: 'href' } },
  required: ['label', 'href'],
};
const paragraph: JsonSchema = {
  type: 'object',
  properties: { type: { type: 'string', const: 'paragraph' }, text: { type: 'string', multiline: true } },
  required: ['type', 'text'],
};
const list: JsonSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'list' },
    style: { default: 'bullet', type: 'string', enum: ['bullet', 'number'] },
    items: { minItems: 1, type: 'array', items: { type: 'string' } },
  },
  required: ['type', 'style', 'items'],
};

test('a nullable string and a nullable object both come apart into the thing and "may be empty"', () => {
  assert.deepEqual(unwrapNullable({ type: ['string', 'null'] }), { nullable: true, inner: { type: 'string' } });
  const section = unwrapNullable({ anyOf: [link, { type: 'null' }], description: 'Empty hides it.' });
  assert.equal(section.nullable, true);
  assert.equal(section.inner.type, 'object');
  assert.equal(section.inner.description, 'Empty hides it.');
  assert.deepEqual(unwrapNullable(link), { nullable: false, inner: link });
});

test('each shape asks for the box it needs', () => {
  assert.equal(fieldKind({ type: 'string' }, 'title').kind, 'text');
  assert.deepEqual(fieldKind({ type: 'string' }, 'body'), { kind: 'text', schema: { type: 'string' }, multiline: true });
  assert.equal((fieldKind({ type: 'string', multiline: true }, 'x') as { multiline: boolean }).multiline, true);
  assert.deepEqual(fieldKind({ type: 'string', enum: ['a', 'b'] }).kind, 'enum');
  assert.deepEqual(fieldKind({ type: 'integer' }), { kind: 'number', schema: { type: 'integer' }, integer: true });
  assert.equal(fieldKind({ type: 'boolean' }).kind, 'boolean');
  const blocks = fieldKind({ oneOf: [paragraph, list] });
  assert.equal(blocks.kind, 'variants');
  assert.equal((blocks as { discriminator: string }).discriminator, 'type');
});

test('a new item starts with what it must have, and its defaults', () => {
  assert.deepEqual(emptyOf(link), { label: '', href: '' });
  assert.deepEqual(emptyOf(list), { type: 'list', style: 'bullet', items: [''] });
  assert.deepEqual(emptyOf({ oneOf: [paragraph, list] }), { type: 'paragraph', text: '' });
  // A section that may be left out starts left out; a line that may be empty starts empty.
  assert.deepEqual(
    emptyOf({
      type: 'object',
      properties: { quote: { anyOf: [link, { type: 'null' }] }, eyebrow: { type: ['string', 'null'] } },
      required: ['quote', 'eyebrow'],
    }),
    { quote: null, eyebrow: '' },
  );
  assert.deepEqual(emptyOf({ default: { daily: 'Daily' }, type: 'object' }), { daily: 'Daily' });
  assert.deepEqual(emptyOf({ default: null, anyOf: [link, { type: 'null' }] }), null);
});

test('a change at a path copies only the way down to it', () => {
  const before = { hero: { title: 'A', cta: { label: 'Go' } }, steps: [{ title: 'one' }, { title: 'two' }] };
  const after = setIn(before, ['steps', '1', 'title'], 'TWO') as typeof before;
  assert.equal(after.steps[1]!.title, 'TWO');
  assert.equal(before.steps[1]!.title, 'two');
  assert.equal(after.hero, before.hero, 'an untouched branch is the same object');
  assert.notEqual(after.steps, before.steps);
  assert.equal(after.steps[0], before.steps[0]);
});

test('labels, summaries and error counts read the way a person would', () => {
  assert.equal(labelFor('primaryCta'), 'Main button');
  assert.equal(labelFor('responseTime'), 'Response time');
  assert.equal(labelFor('2'), '#3');
  assert.equal(labelFor('x', { title: 'Store buttons' }), 'Store buttons');
  assert.equal(summaryOf({ icon: 'mail', title: 'Email' }), 'Email');
  assert.equal(summaryOf({ type: 'table', columns: ['What', 'Why'], rows: [] }), 'Table · What · Why');
  assert.equal(summaryOf({ type: 'list', style: 'bullet', items: ['Your steps', 'Your workouts'] }), 'List · Your steps');
  assert.equal(summaryOf({ type: 'paragraph', text: 'We collect…' }), 'We collect…');
  assert.equal(errorsUnder({ 'hero.title': 'x', 'hero.cta.href': 'y', stats: 'z' }, 'hero'), 2);
});
