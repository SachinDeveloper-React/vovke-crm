/**
 * Which guide belongs to a route — kept apart from `section-guides.ts` so the
 * browser can match a page to its one-line question without downloading the
 * text of every guide in the panel (it was 16 KB gzipped on every page).
 */

/** What the folded card needs: the route, and the question it answers. */
export interface GuideIndexEntry {
  pattern: string;
  question: string;
}

/** The guide index page itself, which needs no guide of its own. */
const GUIDE_PATH = '/dashboard/guide';

/**
 * The entry for a route, or null where there is none.
 *
 * Matched segment by segment against patterns of the same length, so
 * `/dashboard/users/usr_1/coins` finds the Coins tab rather than the member
 * list — and a pattern is preferred over another of the same length when more
 * of its segments are literal. Length has to be equal rather than a prefix:
 * a member tab must not fall back to the member search's guide, which would
 * tell somebody to search for an account they are already looking at.
 */
export function matchGuide<T extends { pattern: string }>(entries: T[], pathname: string | null | undefined): T | null {
  if (!pathname || pathname === GUIDE_PATH) return null;
  const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean);

  let best: T | null = null;
  let bestLiterals = -1;

  for (const entry of entries) {
    const pattern = entry.pattern.split('/').filter(Boolean);
    if (pattern.length !== segments.length) continue;

    let literals = 0;
    let matches = true;
    for (let i = 0; i < pattern.length; i += 1) {
      if (pattern[i].startsWith(':')) continue;
      if (pattern[i] !== segments[i]) {
        matches = false;
        break;
      }
      literals += 1;
    }
    if (matches && literals > bestLiterals) {
      best = entry;
      bestLiterals = literals;
    }
  }

  return best;
}
