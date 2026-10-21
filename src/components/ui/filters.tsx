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

/** The window every figure on the page is taken over. */
export function DaysFilter({ value, options = [7, 14, 30, 90] }: { value: number; options?: number[] }) {
  const { set, pending } = useParamNav();
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      disabled={pending}
      onChange={(_event, next) => {
        if (next) set({ days: next });
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
}: {
  value: string;
  placeholder?: string;
  param?: string;
}) {
  const { set, pending } = useParamNav();
  return (
    <Box
      component="form"
      onSubmit={event => {
        event.preventDefault();
        const input = new FormData(event.currentTarget as HTMLFormElement).get(param);
        set({ [param]: String(input ?? '').trim() || null });
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
                <IconButton size="small" onClick={() => set({ [param]: null })} aria-label="Clear search">
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
}: {
  label: string;
  param: string;
  value: string;
  options: { value: string; label: string }[];
  width?: number;
}) {
  const { set, pending } = useParamNav();
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      disabled={pending}
      onChange={event => set({ [param]: event.target.value })}
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
 */
export function OffsetPager({
  total,
  offset,
  limit,
}: {
  total: number;
  offset: number;
  limit: number;
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
        onClick={() => set({ offset: Math.max(0, offset - limit) || null })}
        startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
      >
        Newer
      </Button>
      <Button
        size="small"
        variant="outlined"
        disabled={pending || offset + limit >= total}
        onClick={() => set({ offset: offset + limit })}
        endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
      >
        Older
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
