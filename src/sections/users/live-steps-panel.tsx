'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
// Imported from their own modules rather than the `ui` barrel: the barrel
// also exports the API-error card, which pulls `src/lib/api` — and that is
// `server-only` — into whatever imports it. A client component may not.
import { Mono } from '@/src/components/ui/evidence';
import { Panel } from '@/src/components/ui/panel';
import { ago, dateTime, number } from '@/src/lib/format';

import { askForSteps, readFreshSteps, type AskState, type FreshSteps } from './live-actions';
import type { Reach, ReachTone } from './reach';

/** A verdict, plus the three facts the row states beside it. */
export interface LiveInstall extends Reach {
  label: string;
  appVersion: string | null;
  lastActiveAt: string | null;
}

/** How long the panel waits for a phone to answer before it says it did not. */
const WAIT_MS = 90_000;
/** How often it asks whether a snapshot has landed. */
const POLL_MS = 3_000;

const OUTCOME: Record<string, { tone: ReachTone; say: string }> = {
  pushed: { tone: 'success', say: 'asked' },
  no_token: { tone: 'warning', say: 'no push token' },
  signed_out: { tone: 'default', say: 'signed out' },
  refused: { tone: 'error', say: 'provider refused it' },
  no_provider: { tone: 'error', say: 'push is not configured' },
};

/** How one ask ended. Keyed by the push's instant, so a second ask starts clean. */
interface Landing {
  for: string;
  fresh: FreshSteps | null;
}

interface Props {
  userId: string;
  installs: LiveInstall[];
  /** The member's own zone, so an instant is written on their clock. */
  zone: string;
}

/**
 * Ask this member's phones for their steps, and watch for the answer.
 *
 * Two halves, and the split is the honest one. Above: what the server knows
 * about each install without asking — signed in, reachable, when it last
 * spoke. Below: the asking, which is a silent push, and then the waiting,
 * because a push receipt is not an answer. The answer is a snapshot that
 * arrives a few seconds later, so the panel polls until the figure moves and
 * says how long it took.
 *
 * It gives up out loud after ninety seconds. A phone force stopped by an
 * OEM battery manager never receives the push at all, and a panel that span
 * forever would have an operator telling a member to wait for something that
 * was never coming.
 */
export function LiveStepsPanel({ userId, installs, zone }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState<AskState, FormData>(askForSteps, {});
  const [landing, setLanding] = useState<Landing | null>(null);

  /** The push's own instant: a snapshot sent after it is an answer to it. */
  const askedAt = state.result?.at ?? null;
  const asked = state.result?.pushed ?? 0;

  // Derived rather than stored, so nothing has to be reset when a second ask
  // starts: the landing carries the ask it belongs to.
  const settled = landing !== null && landing.for === askedAt;
  const waiting = askedAt !== null && asked > 0 && !settled;
  const fresh = settled ? landing.fresh : null;
  const gaveUp = settled && landing.fresh === null;

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    // Nothing was asked of anything, so there is no answer to wait for.
    if (!askedAt || asked === 0) return;

    let live = true;
    const until = Date.now() + WAIT_MS;

    const tick = async () => {
      if (!live) return;
      let latest: FreshSteps | null = null;
      try {
        latest = await readFreshSteps(userId);
      } catch {
        // A read that failed is not an answer either; keep waiting.
      }
      if (!live) return;

      const landed = latest?.syncedAt ? new Date(latest.syncedAt).getTime() > new Date(askedAt).getTime() : false;
      if (landed) {
        setLanding({ for: askedAt, fresh: latest });
        // The tables under this panel were drawn before the snapshot landed.
        router.refresh();
        return;
      }
      if (Date.now() >= until) {
        setLanding({ for: askedAt, fresh: null });
        return;
      }
      timers.current.push(setTimeout(tick, POLL_MS));
    };

    timers.current.push(setTimeout(tick, POLL_MS));
    return () => {
      live = false;
      stop();
    };
  }, [askedAt, asked, userId, router, stop]);

  const askable = installs.filter(install => install.askable).length;
  const waited =
    fresh?.syncedAt && askedAt
      ? Math.max(0, Math.round((new Date(fresh.syncedAt).getTime() - new Date(askedAt).getTime()) / 1000))
      : null;

  return (
    <Panel
      title="Live steps"
      subtitle="Ask this member's phones to send what they have counted, and wait for it to land."
      action={
        <Stack component="form" action={action} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="remind" value="off" />
          <FormControlLabel
            control={<Switch name="remind" size="small" disabled={pending} />}
            label={<Typography variant="caption">Also tell them</Typography>}
            sx={{ mr: 0 }}
          />
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={pending || waiting || askable === 0}
            startIcon={
              pending || waiting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <Iconify icon="solar:refresh-bold-duotone" width={16} />
              )
            }
          >
            {pending ? 'Asking…' : waiting ? 'Waiting…' : 'Ask for steps now'}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        {askable === 0 && (
          <Alert severity="info" variant="outlined">
            No install of this account can be asked: a phone has to be signed in and carry a push token. The list below
            says which of the two is missing on each.
          </Alert>
        )}

        {state.error && (
          <Alert severity="error" variant="outlined">
            {state.error}
          </Alert>
        )}

        {state.result && (
          <Stack spacing={1}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Asked {dateTime(state.result.at, zone)} · {number(state.result.pushed)} of{' '}
              {number(state.result.results.length)} install{state.result.results.length === 1 ? '' : 's'}
              {state.result.reminded === 'created' && ' · and the member was told in words'}
              {state.result.reminded === 'duplicate' && ' · they had already been told today'}
              {state.result.reminded === 'suppressed' && ' · the message was held by their settings'}
            </Typography>
            {state.result.results.map(row => {
              const said = OUTCOME[row.outcome] ?? { tone: 'default' as ReachTone, say: row.outcome };
              return (
                <Stack key={row.deviceId} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Label color={said.tone} variant="soft">
                    {said.say}
                  </Label>
                  <Typography variant="body2">{row.label}</Typography>
                </Stack>
              );
            })}
          </Stack>
        )}

        {waiting && (
          <Alert severity="info" variant="outlined" icon={<CircularProgress size={16} />}>
            The push has gone. Waiting for a snapshot — a phone that is awake usually answers within a few seconds.
          </Alert>
        )}

        {fresh && (
          <Alert severity="success" variant="outlined">
            <Typography variant="subtitle2">
              {number(fresh.steps)} steps on {fresh.localDay}
              {fresh.verifiedSteps !== null && ` · ${number(fresh.verifiedSteps)} verified`}
            </Typography>
            <Typography variant="caption">
              Sent {dateTime(fresh.syncedAt, zone)}
              {waited !== null && ` · ${waited}s after the ask`}
            </Typography>
          </Alert>
        )}

        {gaveUp && (
          <Alert severity="warning" variant="outlined">
            No snapshot in ninety seconds. The provider took the push, so the phone is either off the network, asleep
            under a battery manager, or force stopped — in which case it receives nothing at all until the member opens
            the app themselves. The Health tab says which: it shows whether that push was ever acknowledged, and a push
            that landed and changed nothing is our bug rather than their phone.
          </Alert>
        )}

        <Divider />

        <Stack spacing={1.5}>
          {installs.map(install => (
            <Box key={install.deviceId}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Label color={install.tone} variant="soft">
                  {install.word}
                </Label>
                <Typography variant="subtitle2">{install.label}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  app {install.appVersion ?? '—'} · last request {ago(install.lastActiveAt)} ·{' '}
                  <Mono>{install.deviceId}</Mono>
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {install.why}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Panel>
  );
}
