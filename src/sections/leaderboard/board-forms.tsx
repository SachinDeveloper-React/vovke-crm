'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// Deep import, not the `components/ui` barrel: that barrel re-exports
// `ApiErrorNotice`, which imports `lib/api` and so `next/headers` — pulling
// the whole server-only module into this client component's bundle, which
// Next refuses outright.
import { Mono } from '@/src/components/ui/evidence';
import type { LeaderboardConfig } from '@/src/lib/types';

import {
  LADDER_TEMPLATE,
  PLACEHOLDERS,
  STEPS_TEMPLATE,
  ladderAsText,
  stepsAsText,
} from './ladder-text';
import {
  resetBoard,
  saveLadder,
  saveScoring,
  saveWords,
  type BoardActionState,
} from './board-actions';

function Said({ state }: { state: BoardActionState }) {
  if (!state.ok && !state.error) return null;
  return (
    <Alert severity={state.error ? 'error' : 'success'} variant="outlined">
      {state.error ?? state.ok}
    </Alert>
  );
}

/**
 * Puts one part of the board back to the figures and words the code ships.
 *
 * A form of its own, rendered *beside* the one that saves rather than inside
 * it: a `<form>` within a `<form>` is invalid HTML and the nested one's
 * button would submit whichever the browser decided.
 */
function ResetButton({ what }: { what: 'ladder' | 'words' | 'scoring' }) {
  const [state, action, pending] = useActionState<BoardActionState, FormData>(resetBoard, {});

  return (
    <Stack component="form" action={action} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <input type="hidden" name="what" value={what} />
      <Button type="submit" size="small" color="inherit" loading={pending}>
        Back to the shipped default
      </Button>
      {state.error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {state.error}
        </Typography>
      )}
      {state.ok && (
        <Typography variant="caption" sx={{ color: 'success.main' }}>
          {state.ok}
        </Typography>
      )}
    </Stack>
  );
}

/**
 * The prize ladder, a rung per line.
 *
 * Lines rather than a stack of input boxes because the three rungs are read
 * against each other — what the next place up is worth — which is also how
 * the member's screen shows them.
 */
export function LadderForm({ config }: { config: LeaderboardConfig }) {
  const [state, action, pending] = useActionState<BoardActionState, FormData>(saveLadder, {});

  return (
    <Stack spacing={2}>
      <Stack component="form" action={action} spacing={2}>
        <Said state={state} />

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          One rung per line: <Mono>places | label | coins | perks</Mono>. Places is <Mono>1</Mono> or{' '}
          <Mono>4-10</Mono>; perks are separated by commas; an empty label lets the server write one from the places
          (“Rank 4 – 10”). The ladder has to start at place 1 and each rung continue where the last ended — two rungs
          over one place would pay whichever came first, and a gap is a place that wins nothing while the one below it
          does.
        </Typography>

        <TextField
          name="ladder"
          label="The ladder"
          size="small"
          fullWidth
          required
          multiline
          minRows={4}
          defaultValue={config.tiers.length > 0 ? ladderAsText(config.tiers) : LADDER_TEMPLATE}
          disabled={pending}
          slotProps={{ htmlInput: { style: { fontFamily: 'var(--font-geist-mono)', fontSize: 13 } } }}
        />

        <TextField name="note" label="Why (for the log)" size="small" fullWidth disabled={pending} />

        <Button type="submit" variant="contained" loading={pending} sx={{ alignSelf: 'flex-start' }}>
          Save the ladder
        </Button>
      </Stack>

      <ResetButton what="ladder" />
    </Stack>
  );
}

/**
 * The words: the banner, the note, and the How-it-works steps.
 *
 * Every box may carry placeholders, which the server fills in per reader —
 * so this is the template and the panel shows the filled version above it.
 */
export function WordsForm({ config }: { config: LeaderboardConfig }) {
  const [state, action, pending] = useActionState<BoardActionState, FormData>(saveWords, {});

  return (
    <Stack spacing={2}>
      <Stack component="form" action={action} spacing={2}>
        <Said state={state} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              name="kicker"
              label="Banner — the small line"
              size="small"
              fullWidth
              required
              defaultValue={config.banner.kicker}
              disabled={pending}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              name="title"
              label="Banner — the big line"
              size="small"
              fullWidth
              required
              defaultValue={config.banner.title}
              disabled={pending}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              name="subtitle"
              label="Banner — the line under it"
              size="small"
              fullWidth
              required
              defaultValue={config.banner.subtitle}
              disabled={pending}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="note"
              label="The note under the prize ladder"
              size="small"
              fullWidth
              required
              defaultValue={config.note}
              disabled={pending}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="steps"
              label="How it works — one step per line, Title | What it means"
              size="small"
              fullWidth
              required
              multiline
              minRows={5}
              defaultValue={config.howItWorks.length > 0 ? stepsAsText(config.howItWorks) : STEPS_TEMPLATE}
              disabled={pending}
              slotProps={{ htmlInput: { style: { fontFamily: 'var(--font-geist-mono)', fontSize: 13 } } }}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle2">What a closed week tells the member</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          One line per outcome. A member has to be able to tell “the coins are in my wallet” from “the place was won
          and nothing was paid”, and the second needs a reason — otherwise the only honest reading of a zero is that
          we kept it. <Mono>{'{coins}'}</Mono>, <Mono>{'{rank}'}</Mono>, <Mono>{'{perks}'}</Mono>,{' '}
          <Mono>{'{lastPaid}'}</Mono> and <Mono>{'{week}'}</Mono> are filled in per row.
        </Typography>

        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              name="paid"
              label="Paid — the coins are in the wallet"
              size="small"
              fullWidth
              required
              defaultValue={config.outcomes?.paid ?? ''}
              disabled={pending}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              name="held"
              label="Not paid — the place pays, and prizes were not running"
              size="small"
              fullWidth
              required
              multiline
              defaultValue={config.outcomes?.held ?? ''}
              disabled={pending}
              helperText="Nothing is paid retroactively, so this must not promise that it will be"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="skipped"
              label="Under review — a fraud flag that week"
              size="small"
              fullWidth
              required
              defaultValue={config.outcomes?.skipped ?? ''}
              disabled={pending}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="none"
              label="No prize — below the last paid place"
              size="small"
              fullWidth
              required
              defaultValue={config.outcomes?.none ?? ''}
              disabled={pending}
            />
          </Grid>
        </Grid>

        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          The server fills these in for each reader:{' '}
          {PLACEHOLDERS.map(([token, means], index) => (
            <span key={token}>
              {index > 0 && ' · '}
              <Mono>{token}</Mono> {means}
            </span>
          ))}
          . A placeholder nothing fills is left alone, so a typo reads as a typo rather than as a missing prize.
        </Typography>

        <TextField name="why" label="Why (for the log)" size="small" fullWidth disabled={pending} />

        <Button type="submit" variant="contained" loading={pending} sx={{ alignSelf: 'flex-start' }}>
          Save the words
        </Button>
      </Stack>

      <ResetButton what="words" />
    </Stack>
  );
}

/** What a point is worth, when the week closes, and how deep the board goes. */
export function ScoringForm({ config }: { config: LeaderboardConfig }) {
  const [state, action, pending] = useActionState<BoardActionState, FormData>(saveScoring, {});

  return (
    <Stack spacing={2}>
      <Stack component="form" action={action} spacing={2}>
        <Said state={state} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <TextField
              name="stepsPerPoint"
              label="Steps to a point"
              size="small"
              fullWidth
              defaultValue={config.score.stepsPerPoint}
              disabled={pending}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <TextField
              name="perWorkout"
              label="Points a workout"
              size="small"
              fullWidth
              defaultValue={config.score.perWorkout}
              disabled={pending}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <TextField
              name="perChallenge"
              label="Points a challenge"
              size="small"
              fullWidth
              defaultValue={config.score.perChallenge}
              disabled={pending}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 2.4 }}>
            <TextField
              name="closeAfterHours"
              label="Close, hours into Monday"
              size="small"
              fullWidth
              defaultValue={config.closeAfterHours}
              disabled={pending}
              helperText="So Sunday's late syncs count"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 2.4 }}>
            <TextField
              name="boardSize"
              label="Places served"
              size="small"
              fullWidth
              defaultValue={config.boardSize}
              disabled={pending}
              helperText="What the app's board can show"
            />
          </Grid>
        </Grid>

        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          A changed weight applies to each member at their next recount — a step rollup, a workout, a finished
          challenge — so for a few hours the board holds scores counted both ways. It settles itself; it is not worth
          doing mid-week for fun.
        </Typography>

        <TextField name="note" label="Why (for the log)" size="small" fullWidth disabled={pending} />

        <Button type="submit" variant="contained" loading={pending} sx={{ alignSelf: 'flex-start' }}>
          Save the scoring
        </Button>
      </Stack>

      <ResetButton what="scoring" />
    </Stack>
  );
}
