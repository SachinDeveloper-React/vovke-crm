import type { Install } from '@/src/lib/types';

/**
 * The heartbeat is written at most once every five minutes per install
 * (`middleware/device.ts`), so anything inside six is as close to "now" as
 * the server is ever told it is.
 */
const OPEN_MS = 6 * 60_000;
const RECENT_MS = 60 * 60_000;

export type ReachTone = 'success' | 'warning' | 'default' | 'error';

export interface Reach {
  deviceId: string;
  /** Whether a silent push could be sent to this install at all. */
  askable: boolean;
  tone: ReachTone;
  word: string;
  why: string;
}

/**
 * What the server can honestly say about one install, right now.
 *
 * It cannot say whether the phone has a network — nothing can, from here. A
 * phone that loses its signal does not send a "going offline" message; it
 * simply stops speaking, and the silence is the whole of the evidence. So
 * this reports when the install last spoke and lets the operator read it,
 * rather than drawing a green dot the server cannot stand behind.
 *
 * The order of the clauses is the logic: signed out cannot be asked whatever
 * its token says, and a token the provider has already refused is unreachable
 * however recently the app was open. Getting those the wrong way round
 * produces the one row that would mislead — "app in use" beside a phone
 * nothing can reach.
 *
 * Deliberately free of runtime imports, so it can be tested on its own.
 */
export function reachOf(install: Install, now: number): Reach {
  const id = install.deviceId;

  if (install.revokedAt) {
    return { deviceId: id, askable: false, tone: 'error', word: 'revoked', why: 'This install was signed out for good.' };
  }
  if (!install.signedIn) {
    return {
      deviceId: id,
      askable: false,
      tone: 'default',
      word: 'signed out',
      why: 'Nobody is signed in here, so it has no steps of this account to send.',
    };
  }
  if (!install.push.hasToken) {
    return {
      deviceId: id,
      askable: false,
      tone: 'warning',
      word: 'cannot be reached',
      why: 'No push token — notifications were refused, or this install has never registered one.',
    };
  }
  if (install.push.invalidAt) {
    return {
      deviceId: id,
      askable: false,
      tone: 'warning',
      word: 'token rejected',
      why: 'The provider has refused this token. The app was most likely uninstalled, or its data cleared.',
    };
  }

  const seen = install.lastActiveAt ? new Date(install.lastActiveAt).getTime() : 0;
  if (!seen) {
    return {
      deviceId: id,
      askable: true,
      tone: 'default',
      word: 'never heard from',
      why: 'This install has not made a request yet.',
    };
  }

  const quiet = now - seen;
  if (quiet <= OPEN_MS) {
    return {
      deviceId: id,
      askable: true,
      tone: 'success',
      word: 'app in use',
      why: 'It made a request within the last few minutes, so the app is open and on a network.',
    };
  }
  if (quiet <= RECENT_MS) {
    return {
      deviceId: id,
      askable: true,
      tone: 'default',
      word: 'recently open',
      why: 'Quiet for under an hour. It should still answer a silent push.',
    };
  }
  return {
    deviceId: id,
    askable: true,
    tone: 'warning',
    word: 'quiet',
    why: 'Over an hour without a word. It can still be asked, but a phone that is offline or force stopped will not answer.',
  };
}

/**
 * Every install's reachability, against one reading of the clock.
 *
 * The clock is read here rather than in the page that calls this, for the
 * same reason `ago` reads it inside itself: a component's body has to be
 * pure, and `Date.now()` is the definition of not being.
 */
export function reachOfAll(installs: Install[]): Reach[] {
  const now = Date.now();
  return installs.map(install => reachOf(install, now));
}
