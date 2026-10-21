import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { humanise, number } from '@/src/lib/format';

/**
 * How a step source is named on screen (D-51).
 *
 * Shared by the window of days and by one day's hours, so the same watch
 * reads the same way on both: an operator who has just been told "Samsung
 * Health answered for the day" should see that sentence again, in the same
 * words, when they open the day.
 */

/**
 * What became of one source, in words rather than in the enum the scoring
 * writes (RULES A14–A15) — nobody reading a support ticket should have to
 * know that `not_counted` means "more than the phone could plausibly have
 * seen".
 */
const SOURCE_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  phone: { label: 'the phone’s own counter', tone: 'info' },
  used: { label: 'answered for the day', tone: 'success' },
  lower: { label: 'lower than the phone', tone: 'default' },
  not_counted: { label: 'too far from the phone', tone: 'warning' },
  unverified: { label: 'app not on the allowlist', tone: 'warning' },
  blocked: { label: 'blocked source', tone: 'error' },
  not_computed: { label: 'typed-in steps could not be split out', tone: 'default' },
};

export function statusOf(status: string | null | undefined) {
  if (!status) return { label: 'not recorded', tone: 'default' as const };
  return SOURCE_STATUS[status] ?? { label: humanise(status), tone: 'default' as const };
}

/** Why Health Connect was not read on a phone, when it was not. */
const SOURCES_STATUS: Record<string, string> = {
  read: 'Health Connect read',
  not_consulted: 'Health Connect not read — not connected, or steps not allowed',
  timed_out: 'Health Connect took too long to answer',
  failed: 'Health Connect could not be read',
  rate_limited: 'Health Connect refused the read — called too often',
};

export const readStatus = (status: string | null | undefined) =>
  status ? SOURCES_STATUS[status] ?? humanise(status) : 'not recorded';

/** Enough of a source to name it: a window total carries no per-day verdict. */
export type NamedSource = {
  key: string;
  appName: string;
  isWearable: boolean;
  shown?: boolean;
  answered?: boolean;
};

/** The chips a source carries wherever it is named: a watch, an app shown and never paid. */
export function SourceChips({ source }: { source: Pick<NamedSource, 'isWearable' | 'shown'> }) {
  return (
    <>
      {source.isWearable && (
        <Label color="info" variant="soft">
          watch
        </Label>
      )}
      {source.shown && (
        <Label color="warning" variant="soft">
          shown, not verified
        </Label>
      )}
    </>
  );
}

/** The source's name, its chips, and the package name under it. */
export function SourceName({ source }: { source: NamedSource }) {
  return (
    <Stack spacing={0.25}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
        <Typography variant="subtitle2">{source.appName}</Typography>
        <SourceChips source={source} />
        {source.answered && (
          <Label color="success" variant="soft">
            answered
          </Label>
        )}
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {source.key === 'phone' ? 'the handset’s own sensor' : source.key}
      </Typography>
    </Stack>
  );
}

/** `9,000 · 8,400 countable · 600 typed in` — one source's figures in a cell. */
export function sourceFigures(source: { steps: number; countable: number | null; manualSteps: number | null }): string {
  const parts = [`${number(source.steps)} written`];
  if (source.countable !== null && source.countable !== source.steps) {
    parts.push(`${number(source.countable)} countable`);
  }
  if (source.manualSteps) parts.push(`${number(source.manualSteps)} typed in`);
  return parts.join(' · ');
}
