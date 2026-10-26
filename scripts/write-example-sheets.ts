/**
 * Writes the example sheets to disk — `npm run examples`.
 *
 * The panel builds these on request (`/api/example-sheets/[kind]`), which is
 * where an operator gets one. This is for the other case: handing the files
 * to somebody who does not have the panel open, as an attachment. Both come
 * from the same column lists, so a file written here is the format the
 * importer accepts on the day it was written — and stale once a column
 * changes, which is why the panel's download is the one to send people to.
 *
 * Run with the `react-server` condition so `server-only` resolves to its
 * empty module rather than throwing: this is a script, and there is no
 * client bundle for it to protect.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXAMPLE_SHEETS } from '../src/lib/example-sheets.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '..', process.argv[2] ?? '../docs/examples');

await mkdir(out, { recursive: true });
for (const [kind, sheet] of Object.entries(EXAMPLE_SHEETS)) {
  const file = resolve(out, sheet.filename);
  await writeFile(file, Buffer.from(await sheet.build()));
  console.log(`${kind} → ${file}`);
}
