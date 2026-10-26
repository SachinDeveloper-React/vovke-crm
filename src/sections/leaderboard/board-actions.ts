'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { coins, number } from '@/src/lib/format';
import type { AppConfigView } from '@/src/lib/types';

import { LadderError, ladderFromText, stepsFromText } from './ladder-text';

/**
 * The weekly board's prizes and the words around them (RULES §L, D-89).
 *
 * Everything here writes ⚙ `leaderboard.*` through `PUT /admin/config`, the
 * same door the key-by-key page uses — deliberately, because that door runs
 * the whole merged config through the cross-field validator every read runs
 * *before* storing anything. That is what refuses a ladder with two rungs
 * over the same place, which `tierFor` would otherwise settle by accident on
 * a Monday, with coins. A dedicated endpoint would have to repeat that check
 * or skip it.
 */

export type BoardActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

const figure = (form: FormData, key: string): number => Number(text(form, key).replace(/[,\s]/g, ''));

function changed(): void {
  revalidatePath('/dashboard/leaderboard');
  revalidatePath('/dashboard/config');
}

/** Writes a set of `leaderboard.*` paths, reporting whatever the API says. */
async function write(
  set: Record<string, unknown>,
  note: string | undefined,
  said: string,
): Promise<BoardActionState> {
  const result = await adminWrite<AppConfigView>('PUT', '/admin/config', {
    set,
    note: note || undefined,
  });
  if (!result.ok) return { error: result.error };
  changed();
  return { ok: said };
}

/**
 * The prize ladder.
 *
 * One rung per line, so the three of them are read against each other the
 * way they are read on the member's screen. The shape is checked here by
 * line; whether it is a *ladder* is the API's call.
 */
export async function saveLadder(_previous: BoardActionState, form: FormData): Promise<BoardActionState> {
  let tiers;
  try {
    tiers = ladderFromText(String(form.get('ladder') ?? ''));
  } catch (error) {
    if (error instanceof LadderError) return { error: error.message };
    throw error;
  }

  const places = tiers.reduce((sum, tier) => sum + (tier.toRank - tier.fromRank + 1), 0);
  const perWeek = tiers.reduce((sum, tier) => sum + tier.coins * (tier.toRank - tier.fromRank + 1), 0);

  return write(
    { 'leaderboard.tiers': tiers },
    text(form, 'note'),
    `${number(tiers.length)} rung(s) over ${number(places)} place(s), ${coins(perWeek)} a week if every place is filled. The app has it now.`,
  );
}

/**
 * The words: the banner, the note under the ladder, and the How-it-works
 * steps. Placeholders are filled in by the server per reader, so what is
 * written here is a template and the page shows the filled version beside it.
 */
export async function saveWords(_previous: BoardActionState, form: FormData): Promise<BoardActionState> {
  const kicker = text(form, 'kicker');
  const title = text(form, 'title');
  const subtitle = text(form, 'subtitle');
  const note = text(form, 'note');
  if (!kicker || !title || !subtitle) {
    return { error: 'The banner is three lines, and the app draws all three.' };
  }
  if (!note) return { error: 'The note is the line under the prize ladder.' };

  let howItWorks;
  try {
    howItWorks = stepsFromText(String(form.get('steps') ?? ''));
  } catch (error) {
    if (error instanceof LadderError) return { error: error.message };
    throw error;
  }

  // What a closed week says about itself (D-90). Each one has to say
  // something: an empty reason is a figure with no explanation, which reads
  // as money kept.
  const outcomes = {
    paid: text(form, 'paid'),
    held: text(form, 'held'),
    skipped: text(form, 'skipped'),
    none: text(form, 'none'),
  };
  for (const [state, line] of Object.entries(outcomes)) {
    if (!line) return { error: `The “${state}” line is what a week of that kind tells the member. It cannot be empty.` };
  }

  return write(
    {
      'leaderboard.banner': { kicker, title, subtitle },
      'leaderboard.note': note,
      'leaderboard.howItWorks': howItWorks,
      'leaderboard.outcomes': outcomes,
    },
    text(form, 'why'),
    `Written: “${title}”, the note, ${number(howItWorks.length)} step(s) and the four week outcomes. Members read it on their next refresh — no release.`,
  );
}

/**
 * What a point is worth, when the week closes, and how deep the board goes.
 *
 * Changing a score weight changes everybody's standing at once: the scores
 * already counted keep their figures until each member's next recount (a
 * step rollup, a workout, a challenge), so the board mixes old and new
 * weights for a few hours. Worth saying on the page, and said there.
 */
export async function saveScoring(_previous: BoardActionState, form: FormData): Promise<BoardActionState> {
  const stepsPerPoint = figure(form, 'stepsPerPoint');
  const perWorkout = figure(form, 'perWorkout');
  const perChallenge = figure(form, 'perChallenge');
  const closeAfterHours = figure(form, 'closeAfterHours');
  const boardSize = figure(form, 'boardSize');

  for (const [name, value] of Object.entries({ stepsPerPoint, perWorkout, perChallenge, closeAfterHours, boardSize })) {
    if (!Number.isFinite(value)) return { error: `${name} is a number, and that is not one.` };
  }
  if (stepsPerPoint < 1) {
    return { error: 'A point per zero steps puts every member on the same score. Steps per point is at least 1.' };
  }

  return write(
    {
      'leaderboard.score': { stepsPerPoint, perWorkout, perChallenge },
      'leaderboard.closeAfterHours': closeAfterHours,
      'leaderboard.boardSize': boardSize,
    },
    text(form, 'note'),
    `A point per ${number(stepsPerPoint)} steps, ${number(perWorkout)} a workout, ${number(perChallenge)} a challenge. The week closes ${number(closeAfterHours)}h into Monday, ${number(boardSize)} places served.`,
  );
}

/** Puts the ladder or the words back to what the code ships. */
export async function resetBoard(_previous: BoardActionState, form: FormData): Promise<BoardActionState> {
  const what = text(form, 'what');
  const paths: Record<string, string[]> = {
    ladder: ['leaderboard.tiers'],
    words: ['leaderboard.banner', 'leaderboard.note', 'leaderboard.howItWorks', 'leaderboard.outcomes'],
    scoring: ['leaderboard.score', 'leaderboard.closeAfterHours', 'leaderboard.boardSize'],
  };
  const reset = paths[what];
  if (!reset) return { error: 'Which part?' };

  const result = await adminWrite<AppConfigView>('PUT', '/admin/config', {
    reset,
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  changed();
  return { ok: `Back to what the code ships (${reset.join(', ')}).` };
}
