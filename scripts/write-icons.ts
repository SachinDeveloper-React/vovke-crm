/**
 * Writes the panel's icons, copied out of the `@iconify-json/*` sets so the
 * browser never asks api.iconify.design for one:
 *
 *   - `src/components/iconify/icon-data.ts` — the **shell** icons, the ones
 *     named under `src/layout` and `src/components` (sidebar, header, the
 *     shared widgets). Bundled, so the frame of every page draws at once.
 *   - `src/components/iconify/icon-pages.json` — **every other** icon, read
 *     only by the `/iconify/[version]/[prefix]` route. A page asks for the
 *     handful it uses, once; the URL carries a hash of this file, so the
 *     answer is cached forever and a new icon set is a new URL. Bundling all
 *     of them was 52 KB gzipped on every page for ~10 icons each one uses.
 *
 * `@iconify/react` loads an icon it has not been given from
 * api.iconify.design at runtime, and the panel's CSP (`connect-src 'self'`
 * in `src/proxy.ts`) refuses that request — correctly. So until this file
 * existed every icon in the panel rendered as an empty span, and every
 * icon-only button (the pencil and the bin on each table row) was there,
 * clickable, and invisible.
 *
 * Run it after naming a new icon: `npm run icons`. `icons.test.ts` fails
 * when the source names one this file does not carry.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { iconNamesIn } from '../src/components/iconify/icon-names.ts';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');

type IconSet = {
  prefix: string;
  width?: number;
  height?: number;
  icons: Record<string, { body: string; width?: number; height?: number }>;
  aliases?: Record<string, { parent: string; width?: number; height?: number }>;
};

const all = iconNamesIn(path.join(root, 'src'));
const shell = new Set([
  ...iconNamesIn(path.join(root, 'src/layout')),
  ...iconNamesIn(path.join(root, 'src/components')),
]);

const missing: string[] = [];
const cache = new Map<string, IconSet | null>();
function full(prefix: string): IconSet | null {
  if (!cache.has(prefix)) {
    try {
      cache.set(prefix, JSON.parse(readFileSync(require.resolve(`@iconify-json/${prefix}/icons.json`), 'utf8')) as IconSet);
    } catch {
      cache.set(prefix, null);
    }
  }
  return cache.get(prefix)!;
}

/** The named icons as Iconify sets, one per prefix, carrying only what was asked for. */
function subset(names: string[]): IconSet[] {
  const byPrefix = new Map<string, string[]>();
  for (const name of names) {
    const [prefix, icon] = name.split(':');
    byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), icon]);
  }
  const sets: IconSet[] = [];
  for (const [prefix, icons] of byPrefix) {
    const set = full(prefix);
    if (!set) {
      missing.push(...icons.map(icon => `${prefix}:${icon} (no @iconify-json/${prefix} installed)`));
      continue;
    }
    const out: IconSet = { prefix, width: set.width, height: set.height, icons: {}, aliases: {} };
    for (const icon of icons) {
      if (set.icons[icon]) out.icons[icon] = set.icons[icon];
      else if (set.aliases?.[icon]) {
        const alias = set.aliases[icon];
        out.aliases![icon] = alias;
        if (set.icons[alias.parent]) out.icons[alias.parent] = set.icons[alias.parent];
      } else missing.push(`${prefix}:${icon}`);
    }
    if (Object.keys(out.aliases!).length === 0) delete out.aliases;
    sets.push(out);
  }
  return sets;
}

const shellSets = subset(all.filter(name => shell.has(name)));
const pageNames = all.filter(name => !shell.has(name));
const pageSets = subset(pageNames);

if (missing.length > 0) {
  console.error(`No such icon(s):\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

const pagesJson = JSON.stringify(Object.fromEntries(pageSets.map(set => [set.prefix, set])));
const version = createHash('sha256').update(pagesJson).digest('hex').slice(0, 10);

writeFileSync(
  path.join(root, 'src/components/iconify/icon-data.ts'),
  `// Written by \`npm run icons\` (scripts/write-icons.ts) — do not edit by hand.
// ${shell.size} shell icons, bundled; the other ${pageNames.length} are served by /iconify/${version}/<prefix>.
import type { IconifyJSON } from '@iconify/react';

/** Changes whenever the page icons do, so their URLs can be cached forever. */
export const ICON_VERSION = '${version}';

export const ICON_SETS: IconifyJSON[] = ${JSON.stringify(shellSets)};
`,
);
writeFileSync(path.join(root, 'src/components/iconify/icon-pages.json'), pagesJson);
console.log(`Wrote ${shell.size} shell icons (bundled) and ${pageNames.length} page icons (version ${version}).`);
