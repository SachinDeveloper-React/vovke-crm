import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { readFileSync } from 'node:fs';

import { ICON_SETS } from './icon-data.ts';
import { iconNamesIn } from './icon-names.ts';

/**
 * Every icon the source names is in the bundle.
 *
 * An icon left out is not an error anywhere else: `@iconify/react` tries to
 * fetch it, the CSP refuses, and the button it sat on renders empty — which
 * is how every row's edit pencil went missing without anybody noticing.
 */
test('every icon the panel names is bundled', () => {
  const pages = JSON.parse(readFileSync(path.resolve(import.meta.dirname, 'icon-pages.json'), 'utf8')) as Record<
    string,
    (typeof ICON_SETS)[number]
  >;
  const bundled = new Set(
    [...ICON_SETS, ...Object.values(pages)].flatMap(set => [
      ...Object.keys(set.icons).map(name => `${set.prefix}:${name}`),
      ...Object.keys(set.aliases ?? {}).map(name => `${set.prefix}:${name}`),
    ]),
  );
  const named = iconNamesIn(path.resolve(import.meta.dirname, '../..'));
  const missing = named.filter(name => !bundled.has(name));
  assert.deepEqual(missing, [], `Run \`npm run icons\` — these are named but not bundled: ${missing.join(', ')}`);
});
