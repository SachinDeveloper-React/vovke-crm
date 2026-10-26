import type { LeaderboardTierConfig, LeaderboardStep } from '@/src/lib/types';

/**
 * The prize ladder and the How-it-works steps as text, and back again.
 *
 * Its own module because both ends need it: the forms open with the text (a
 * client component rendering a textarea) and the actions parse it back (a
 * `'use server'` file, which may only export actions). The same shape the
 * diet plans' programme uses (`nutrition/plan-text`), and for the same
 * reason — a list of three or four short rows is faster to read and to edit
 * as lines than as a stack of twelve input boxes.
 *
 *     1    | 1st Place | 5000 | Premium T-Shirt, Water Bottle
 *     2-3  | Top 3     | 3000 | Premium T-Shirt, Fitness Mat
 *     4-10 | Top 10    | 1000 | Fitness Mat
 */

export function ladderAsText(tiers: LeaderboardTierConfig[]): string {
  return tiers
    .map(tier => {
      const places = tier.fromRank === tier.toRank ? `${tier.fromRank}` : `${tier.fromRank}-${tier.toRank}`;
      return [places, tier.label ?? '', tier.coins, (tier.perks ?? []).join(', ')]
        .join(' | ')
        .replace(/(\s*\|\s*)+$/, '');
    })
    .join('\n');
}

export const LADDER_TEMPLATE = `1 | 1st Place | 5000 | Premium T-Shirt, Water Bottle
2-3 | Top 3 | 3000 | Premium T-Shirt, Fitness Mat
4-10 | Top 10 | 1000 | Fitness Mat`;

export class LadderError extends Error {}

/**
 * The text as the config's own array.
 *
 * Only the shape is checked here — that each line reads as places, a label,
 * coins and perks. Whether the *ladder* makes sense is the API's call and it
 * is a better judge: it refuses two rungs over the same place and a gap
 * between them against the whole merged config, which is the same check
 * every read runs. So a mistake is reported by line here and by rule there.
 */
export function ladderFromText(text: string): LeaderboardTierConfig[] {
  const tiers: LeaderboardTierConfig[] = [];
  const lines = text.split(/\r?\n/);

  for (const [index, raw] of lines.entries()) {
    const line = raw.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    const at = `Line ${index + 1}`;
    const [places = '', label = '', coins = '', perks = ''] = line.split('|').map(part => part.trim());

    const match = /^(\d+)\s*(?:[-–]\s*(\d+))?$/.exec(places);
    if (!match) {
      throw new LadderError(`${at}: “${places}” is not a place or a range of them — write 1, or 4-10.`);
    }
    const fromRank = Number(match[1]);
    const toRank = match[2] === undefined ? fromRank : Number(match[2]);
    if (fromRank < 1 || toRank < fromRank) {
      throw new LadderError(`${at}: ${places} runs backwards — the lower place comes first.`);
    }

    const amount = Number(coins.replace(/[,\s]/g, ''));
    if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
      throw new LadderError(`${at}: “${coins}” is not a number of coins.`);
    }

    tiers.push({
      fromRank,
      toRank,
      coins: amount,
      perks: perks
        .split(/[,;]/)
        .map(perk => perk.trim())
        .filter(Boolean),
      // Empty means "let the server derive it from the ranks", which is what
      // leaving the column blank should mean.
      ...(label ? { label } : {}),
    });
  }

  if (tiers.length === 0) {
    throw new LadderError('Nothing to read. One rung per line: places | label | coins | perks.');
  }
  return tiers;
}

/**
 * The How-it-works steps as text — `Title | Detail`, one per line.
 *
 * A detail may hold the `|` character nowhere else, which is why the split
 * takes the first one and leaves the rest of the line alone.
 */
export function stepsAsText(steps: LeaderboardStep[]): string {
  return steps.map(step => `${step.title} | ${step.detail}`).join('\n');
}

export const STEPS_TEMPLATE = `Compete every week | A point for every {stepsPerPoint} steps, {perWorkout} for a workout and {perChallenge} for a challenge.
Climb your country board | You are ranked against everyone in {scope}.
Finish in the top {lastPaid} | {prizes}.
Rewards land on Monday | Coins are credited to your wallet once the week closes.`;

export function stepsFromText(text: string): LeaderboardStep[] {
  const steps: LeaderboardStep[] = [];

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    const cut = line.indexOf('|');
    if (cut < 0) {
      throw new LadderError(`Line ${index + 1}: a step is “Title | What it means”, and this line has no |.`);
    }
    const title = line.slice(0, cut).trim();
    const detail = line.slice(cut + 1).trim();
    if (!title || !detail) {
      throw new LadderError(`Line ${index + 1}: a step needs both a title and a detail.`);
    }
    steps.push({ title, detail });
  }

  if (steps.length === 0) {
    throw new LadderError('Nothing to read. One step per line: Title | What it means.');
  }
  return steps;
}

/** The placeholders the server fills in, for the form to list. */
export const PLACEHOLDERS = [
  ['{scope}', 'the board’s country, for people — “India”'],
  ['{stepsPerPoint}', 'steps to a point'],
  ['{perWorkout}', 'points for a workout'],
  ['{perChallenge}', 'points for a challenge'],
  ['{lastPaid}', 'the last place that wins anything'],
  ['{tierCount}', 'how many rungs the ladder has'],
  ['{prizes}', 'every rung as a sentence, from the ladder itself'],
] as const;
