import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { ICON_PREFIXES } from './icon-prefixes.ts';

const NAME = new RegExp(`['"\`]((?:${ICON_PREFIXES.join('|')}):[a-z0-9][a-z0-9-]*)['"\`]`, 'g');

/**
 * Every icon name written as a string literal anywhere under `dir`.
 *
 * Node-only (it reads the tree): used by `scripts/write-icons.ts` to decide
 * what to bundle, and by `icons.test.ts` to say what was left out.
 */
export function iconNamesIn(dir: string): string[] {
  const found = new Set<string>();
  const walk = (at: string) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = path.join(at, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name) && entry.name !== 'icon-data.ts') {
        for (const match of readFileSync(full, 'utf8').matchAll(NAME)) found.add(match[1]);
      }
    }
  };
  walk(dir);
  return [...found].sort();
}
