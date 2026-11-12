import type { IconifyJSON } from '@iconify/react';

import PAGE_ICONS from '@/src/components/iconify/icon-pages.json';
import { ICON_VERSION } from '@/src/components/iconify/icon-data';

/**
 * The icons a page asks for, out of the ones not bundled with the shell.
 *
 * `Iconify` (src/components/iconify/iconify.tsx) calls this through
 * `setCustomIconsLoader` with every icon a render needs in one go, so a page
 * costs one small request per icon set, the first time only. The version in
 * the path is a hash of the whole page set, which is what makes the year-long
 * `immutable` safe: a different set is a different URL. A request for an
 * older version still gets today's icons, without the long cache.
 *
 * Open to anyone, deliberately — these are public icon outlines, and the
 * sign-in page draws some of them before there is a session.
 */
const SETS = PAGE_ICONS as unknown as Record<string, IconifyJSON>;
const NAME = /^[a-z0-9][a-z0-9-]*$/;

export async function GET(request: Request, context: { params: Promise<{ version: string; prefix: string }> }) {
  const { version, prefix } = await context.params;
  const set = SETS[prefix];
  if (!set) return Response.json({ error: `No “${prefix}” icons here.` }, { status: 404 });

  const asked = (new URL(request.url).searchParams.get('icons') ?? '')
    .split(',')
    .filter(name => NAME.test(name))
    .slice(0, 200);

  const icons: IconifyJSON['icons'] = {};
  const aliases: NonNullable<IconifyJSON['aliases']> = {};
  const notFound: string[] = [];
  for (const name of asked) {
    const alias = set.aliases?.[name];
    if (set.icons[name]) icons[name] = set.icons[name];
    else if (alias && set.icons[alias.parent]) {
      aliases[name] = alias;
      icons[alias.parent] = set.icons[alias.parent];
    } else notFound.push(name);
  }

  const body: IconifyJSON = {
    prefix,
    width: set.width,
    height: set.height,
    icons,
    ...(Object.keys(aliases).length ? { aliases } : {}),
    ...(notFound.length ? { not_found: notFound } : {}),
  };
  return Response.json(body, {
    headers: {
      'Cache-Control':
        version === ICON_VERSION ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
