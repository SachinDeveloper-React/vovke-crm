'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// From the module rather than the barrel: `components/ui/index.ts` also
// re-exports the error notice, which imports the `server-only` API client,
// and a client component pulling that in fails the build.
import { FilterBar, SelectFilter, useParamNav } from '@/src/components/ui/filters';
import type { TimelineDevice } from '@/src/lib/types';

import { setDayRejections, type ActionState } from './timeline-actions';

/**
 * The day being read, and how much of it.
 *
 * In the query string like every other filter here, so a minute worth
 * arguing about is a link somebody can send. The day picker is a native date
 * input rather than a calendar widget: an operator comparing this against a
 * member's screenshot types the date.
 */
export function TimelineFilters({
  userId,
  date,
  overlapsOnly,
  limit,
  view,
}: {
  userId: string;
  date: string;
  overlapsOnly: boolean;
  limit: number;
  view: 'runs' | 'minutes';
}) {
  const { set, pending } = useParamNav();
  return (
    <FilterBar>
      <TextField
        type="date"
        size="small"
        label="Day"
        value={date}
        disabled={pending}
        // The offset goes with it: page four of one day means nothing on the next.
        onChange={event => set({ date: event.target.value, offset: null })}
        sx={{ width: 170 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <SelectFilter
        label="Show"
        param="overlaps"
        value={overlapsOnly ? 'only' : 'all'}
        options={[
          { value: 'all', label: 'Every minute' },
          { value: 'only', label: 'Overlaps only' },
        ]}
        width={170}
      />
      <SelectFilter
        label="Rows"
        param="view"
        value={view}
        options={[
          { value: 'runs', label: 'Stretches' },
          { value: 'minutes', label: 'Every minute' },
        ]}
        width={150}
      />
      {view === 'minutes' ? (
        <SelectFilter
          label="Per page"
          param="limit"
          value={String(limit)}
          options={[50, 100, 250, 500].map(size => ({ value: String(size), label: String(size) }))}
          width={110}
        />
      ) : null}
      {/* A plain link, not an action: the browser downloads it, and the
          route is the same read with the same filter behind it. */}
      <Button
        size="small"
        color="inherit"
        component="a"
        href={`/dashboard/users/${encodeURIComponent(userId)}/timeline/export?date=${date}${overlapsOnly ? '&overlaps=only' : ''}`}
        download
      >
        CSV
      </Button>
    </FilterBar>
  );
}

/**
 * Picking which phone the day counts (D-88).
 *
 * The whole set is posted, not one id toggled, so "keep only this phone" is
 * one call and unticking everything is how a day is given back. The last
 * phone cannot be taken away — the API refuses it, and so does the button,
 * because an operator should find that out before they write a note.
 */
export function TimelineRejectForm({
  userId,
  localDay,
  devices,
}: {
  userId: string;
  localDay: string;
  devices: TimelineDevice[];
}) {
  const [state, submit, pending] = useActionState<ActionState, FormData>(setDayRejections, {});
  const [rejected, setRejected] = useState<string[]>(
    devices.filter(device => device.rejected).map(device => device.deviceId),
  );

  const toggle = (deviceId: string) =>
    setRejected(current =>
      current.includes(deviceId) ? current.filter(id => id !== deviceId) : [...current, deviceId],
    );

  const everyone = rejected.length >= devices.length;
  const unchanged =
    rejected.length === devices.filter(device => device.rejected).length &&
    rejected.every(id => devices.find(device => device.deviceId === id)?.rejected);

  return (
    <Stack component="form" action={submit} spacing={2} sx={{ px: 3, py: 2 }}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="localDay" value={localDay} />
      {rejected.map(deviceId => (
        <input key={deviceId} type="hidden" name="reject" value={deviceId} />
      ))}

      <Typography variant="subtitle2">Leave a phone out of this day</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
        {devices.map(device => (
          <Stack key={device.deviceId} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={rejected.includes(device.deviceId)}
                  onChange={() => toggle(device.deviceId)}
                  disabled={pending}
                />
              }
              label={device.name}
            />
            <Button
              size="small"
              color="inherit"
              disabled={pending || devices.length < 2}
              onClick={() => setRejected(devices.filter(other => other.deviceId !== device.deviceId).map(other => other.deviceId))}
            >
              Keep only this
            </Button>
          </Stack>
        ))}
      </Stack>

      <TextField
        name="note"
        size="small"
        label="Why (kept on the audit row)"
        placeholder="Lent to a friend for the afternoon"
        disabled={pending}
        fullWidth
      />

      {everyone ? (
        <Alert severity="warning">
          A day has to keep at least one phone. Untick the one it should count.
        </Alert>
      ) : null}
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.ok ? <Alert severity="success">{state.ok}</Alert> : null}

      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" size="small" disabled={pending || everyone || unchanged}>
          {rejected.length === 0 ? 'Count every phone' : `Re-score without ${rejected.length}`}
        </Button>
        <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
          The day is scored again before this answers.
        </Typography>
      </Stack>
    </Stack>
  );
}
