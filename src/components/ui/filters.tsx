'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Iconify } from '@/src/components/iconify/iconify';

/**
 * Filters push to the URL, never to local state.
 *
 * Which means every view an operator reaches is a link they can send to the
 * person who has to fix it — "the fleet, last 7 days, this build" is an
 * address rather than a sequence of clicks to describe.
 *
 * The current search string is read off the location at click time rather
 * than through `useSearchParams`, so one filter never drops another's value.
 */
export function useParamNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const set = (values: Record<string, string | number | null>) => {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, String(value));
    }
    const query = params.toString();
    startTransition(() => {
      router.push(`${pathname}${query ? `?${query}` : ''}` as Parameters<typeof router.push>[0]);
    });
  };

  return { set, pending };
}

/**
 * The pagers a filter sends back to their first page.
 *
 * Changing what a list shows has to drop its offset: picking a narrower
 * filter while on page four used to leave `offset` where it was, and an
 * offset past the end of the new list is an empty table with no sign of why.
 * A page with two lists names both where a filter narrows both.
 */
export type Resets = string | string[] | null;

const cleared = (resets: Resets): Record<string, null> =>
  Object.fromEntries((resets === null ? [] : [resets].flat()).map(key => [key, null]));

/** The window every figure on the page is taken over. */
export function DaysFilter({
  value,
  options = [7, 14, 30, 90],
  resets = 'offset',
}: {
  value: number;
  options?: number[];
  /** Widening or narrowing the window goes back to the first page of it. */
  resets?: Resets;
}) {
  const { set, pending } = useParamNav();
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      disabled={pending}
      onChange={(_event, next) => {
        if (next) set({ days: next, ...cleared(resets) });
      }}
      aria-label="Window in days"
    >
      {options.map(option => (
        <ToggleButton key={option} value={option} sx={{ px: 1.5 }}>
          {option}d
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

/** An id, an email, a phone or part of a name — whatever support was given. */
export function SearchFilter({
  value,
  placeholder = 'Search…',
  param = 'q',
  resets = 'offset',
}: {
  value: string;
  placeholder?: string;
  param?: string;
  /** The pager(s) this filter narrows; each goes back to its first page. */
  resets?: Resets;
}) {
  const { set, pending } = useParamNav();
  const narrow = (values: Record<string, string | number | null>) => set({ ...values, ...cleared(resets) });
  return (
    <Box
      component="form"
      onSubmit={event => {
        event.preventDefault();
        const input = new FormData(event.currentTarget as HTMLFormElement).get(param);
        narrow({ [param]: String(input ?? '').trim() || null });
      }}
      sx={{ width: { xs: 1, sm: 360 } }}
    >
      <TextField
        name={param}
        size="small"
        fullWidth
        defaultValue={value}
        placeholder={placeholder}
        disabled={pending}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: value ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => narrow({ [param]: null })} aria-label="Clear search">
                  <Iconify icon="eva:close-fill" width={16} />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />
    </Box>
  );
}

/** One dimension, as a dropdown — a flag's status, a severity, a platform. */
export function SelectFilter({
  label,
  param,
  value,
  options,
  width = 150,
  resets = 'offset',
}: {
  label: string;
  param: string;
  value: string;
  options: { value: string; label: string }[];
  width?: number;
  /**
   * The pager this filter belongs to.
   *
   * Changing what a list shows goes back to its first page: picking a
   * narrower filter while on page four used to leave `offset` where it was,
   * and an offset past the end of the new list is an empty table with no
   * sign of why.
   */
  resets?: Resets;
}) {
  const { set, pending } = useParamNav();
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      disabled={pending}
      onChange={event => set({ [param]: event.target.value, ...cleared(resets) })}
      sx={{ width }}
    >
      {options.map(option => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

/**
 * Cursored paging, as two buttons.
 *
 * The trail is cursored on a time-ordered id rather than offset, so a page
 * cannot shift under a reader while new rows arrive — which also means there
 * is no "previous": going back is the browser's job, and starting over is
 * dropping the cursor.
 */
export function CursorPager({ next, cursor }: { next: string | null; cursor: string }) {
  const { set, pending } = useParamNav();
  if (!next && !cursor) return null;
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'flex-end', px: 3, py: 2 }}>
      {cursor && (
        <Button size="small" color="inherit" disabled={pending} onClick={() => set({ cursor: null })}>
          Start over
        </Button>
      )}
      {next && (
        <Button
          size="small"
          variant="outlined"
          disabled={pending}
          onClick={() => set({ cursor: next })}
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
        >
          Older
        </Button>
      )}
    </Stack>
  );
}

/**
 * Paging by offset, for a list that knows how many it has.
 *
 * The cursor pager above is for feeds, where new rows arrive at the top and
 * an offset would shift a page under the reader. A filtered list of accounts
 * is the other case: it has a total, and "page 3 of 7" is what an operator
 * wants to be able to say.
 *
 * `param` is for a page carrying two lists. The gym is exercises *and* the
 * templates built out of them, and a member's badges are the shelf *and*
 * every challenge period they finished — one `?offset=` cannot mean both, so
 * each table names its own (`templateOffset`, `challengeOffset`) and the link
 * still says which page of which.
 *
 * `labels` is for a list whose order is not time. "Newer" and "Older" are
 * right for a feed and wrong for a leaderboard, where back is up the board.
 */
export function OffsetPager({
  total,
  offset,
  limit,
  param = 'offset',
  labels = ['Newer', 'Older'],
}: {
  total: number;
  offset: number;
  limit: number;
  param?: string;
  labels?: [string, string];
}) {
  const { set, pending } = useParamNav();
  if (total <= limit) return null;
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'flex-end', px: 3, py: 2 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
        {offset + 1}–{Math.min(total, offset + limit)} of {total.toLocaleString('en-IN')} · page {page} of {pages}
      </Typography>
      <Button
        size="small"
        color="inherit"
        disabled={pending || offset === 0}
        onClick={() => set({ [param]: Math.max(0, offset - limit) || null })}
        startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
      >
        {labels[0]}
      </Button>
      <Button
        size="small"
        variant="outlined"
        disabled={pending || offset + limit >= total}
        onClick={() => set({ [param]: offset + limit })}
        endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
      >
        {labels[1]}
      </Button>
    </Stack>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
      {children}
    </Stack>
  );
}
