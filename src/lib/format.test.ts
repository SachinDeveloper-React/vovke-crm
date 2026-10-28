import assert from 'node:assert/strict';
import { test } from 'node:test';

import { date, dateTime, dayTick } from './format.ts';

/**
 * These run twice — once with the process in UTC and once outside it (see the
 * `test` script) — because the fault they are here for only showed up in one
 * of those: `Intl` with no `timeZone` reads the zone the runtime is in, so a
 * hold that releases at 06:44 pm IST was printed as 01:14 pm on a UTC server
 * and nothing on screen said which clock it was. Every assertion below must
 * hold whatever `TZ` is set to.
 */

/** The hold from the 28 Oct escrow: due 31 Oct 13:14:30 UTC. */
const RELEASE = '2026-10-31T13:14:30.528Z';

test('an instant is written on the given zone\'s clock, and says which', () => {
  const ist = dateTime(RELEASE, 'Asia/Kolkata');
  assert.match(ist, /31 Oct 2026/);
  assert.match(ist, /06:44/);
  assert.match(ist, /IST/);
  assert.doesNotMatch(ist, /01:14/);

  const utc = dateTime(RELEASE, 'UTC');
  assert.match(utc, /01:14/);
  assert.match(utc, /UTC/);
});

test('the default zone is the panel\'s, not the process\'s', () => {
  assert.equal(dateTime(RELEASE), dateTime(RELEASE, 'Asia/Kolkata'));
});

test('an instant can fall on another day in another zone', () => {
  assert.equal(date('2026-10-31T19:30:00Z', 'Asia/Kolkata'), '01 Nov 2026');
  assert.equal(date('2026-10-31T19:30:00Z', 'UTC'), '31 Oct 2026');
});

test('a local day is a label: no zone moves it', () => {
  for (const zone of ['Asia/Kolkata', 'UTC', 'America/New_York', 'Pacific/Kiritimati']) {
    assert.equal(date('2026-10-28', zone), '28 Oct 2026');
  }
  assert.equal(dayTick('2026-10-28'), '28 Oct');
  assert.equal(dayTick('not-a-day'), 'not-a-day');
});

test('nothing in, dash out', () => {
  assert.equal(dateTime(null), '—');
  assert.equal(dateTime('nonsense'), '—');
  assert.equal(date(undefined), '—');
});
