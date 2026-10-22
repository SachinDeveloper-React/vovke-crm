'use client';

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import NoSsr from '@mui/material/NoSsr';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Iconify } from '../iconify/iconify';
import { guideFor, type SectionGuide as Guide } from '@/src/layout/section-guides';
import { paths } from '@/src/layout/paths';
import { TextLink } from './nav';

/**
 * Which sections the operator has collapsed. One key holding a list, rather
 * than a key per section: there are forty-odd of them, and a reader who hides
 * one does not want the browser's storage inspector to fill up.
 */
const STORAGE_KEY = 'vokve-crm.guide.collapsed';

function readCollapsed(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
  } catch {
    // Private windows, blocked site data, a value somebody edited by hand:
    // none of them is a reason for the guide not to render.
    return [];
  }
}

function writeCollapsed(patterns: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  } catch {
    // The guide still works for this visit; only the memory of it is lost.
  }
}

/**
 * The guide for whichever page this is, above the page itself.
 *
 * Rendered from `PageHeader` and from the member frame rather than from each
 * page, so a page gets its guide by being at a route the registry knows —
 * `layout/section-guides.ts` is the only place to edit.
 *
 * Open the first time and remembered after that, which is the order of the
 * two readers it is for: somebody handed the panel today needs to be told
 * what a page does before they touch it, and somebody who has read it wants
 * the figures at the top of the screen.
 *
 * Client-only, behind `NoSsr`, for one reason: *whether it has been read* is
 * in the browser's own storage and the server cannot know it. Rendered on the
 * server it would always come back open, and a card that unfolds and then
 * folds itself shut on every navigation is worse than one that appears a
 * frame late. Inside the boundary the stored answer can simply be read as the
 * initial state, with no effect and nothing to reconcile.
 */
export function SectionGuide() {
  const guide = guideFor(usePathname());
  if (!guide) return null;

  return (
    <NoSsr>
      {/* Keyed, so moving between two guided pages re-reads the stored
          answer for the new one instead of keeping the old one's. */}
      <GuideCard key={guide.pattern} guide={guide} />
    </NoSsr>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const [open, setOpen] = useState(() => !readCollapsed().includes(guide.pattern));

  const toggle = useCallback(() => {
    setOpen(current => {
      const next = !current;
      const collapsed = readCollapsed().filter(entry => entry !== guide.pattern);
      writeCollapsed(next ? collapsed : [...collapsed, guide.pattern]);
      return next;
    });
  }, [guide.pattern]);

  return (
    <Card
      variant="outlined"
      sx={{
        flexShrink: 0,
        mb: 3,
        borderColor: theme => alpha(theme.palette.info.main, 0.24),
        bgcolor: theme => alpha(theme.palette.info.main, 0.04),
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ px: 2.5, py: 2, alignItems: 'flex-start' }}>
        <Iconify
          icon="solar:notebook-bookmark-bold-duotone"
          width={22}
          sx={{ color: 'info.main', mt: 0.25 }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2">What this page is for</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {guide.question}
          </Typography>
        </Box>
        <Button
          size="small"
          color="inherit"
          onClick={toggle}
          sx={{ flexShrink: 0 }}
          endIcon={
            <Iconify icon={open ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'} width={18} />
          }
        >
          {open ? 'Hide' : 'Read'}
        </Button>
      </Stack>

      <Collapse in={open} unmountOnExit>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Stack spacing={2.5} sx={{ px: 2.5, py: 2.5 }}>
          <Typography variant="body2">{guide.what}</Typography>

          <GuideList
            title="How it is used"
            icon="solar:list-check-bold-duotone"
            items={guide.how}
            ordered
          />

          <GuideList
            title="What you can change here"
            icon="solar:pen-new-square-bold-duotone"
            items={guide.writes.length > 0 ? guide.writes : ['Nothing — this page only reads.']}
          />

          <GuideList
            title="Worth knowing before you act"
            icon="solar:danger-triangle-bold-duotone"
            items={guide.careful}
            tone="warning"
          />

          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Every page has one of these.{' '}
            <TextLink href={paths.dashboard.guide} variant="caption">
              Read the whole panel end to end
            </TextLink>
            .
          </Typography>
        </Stack>
      </Collapse>
    </Card>
  );
}

/** One block of the guide: a heading, and the lines under it. */
function GuideList({
  title,
  icon,
  items,
  ordered = false,
  tone = 'info',
}: {
  title: string;
  icon: string;
  items: string[];
  ordered?: boolean;
  tone?: 'info' | 'warning';
}) {
  if (items.length === 0) return null;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
        <Iconify icon={icon} width={18} sx={{ color: `${tone}.main` }} />
        <Typography variant="subtitle2">{title}</Typography>
      </Stack>
      <Box component={ordered ? 'ol' : 'ul'} sx={{ m: 0, pl: 3.5, display: 'grid', gap: 0.75 }}>
        {items.map(item => (
          <Typography key={item} component="li" variant="body2" sx={{ color: 'text.secondary' }}>
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
