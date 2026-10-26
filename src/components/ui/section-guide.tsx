'use client';

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Iconify } from '../iconify/iconify';
import { guideFor, type SectionGuide as Guide } from '@/src/layout/section-guides';
import { paths } from '@/src/layout/paths';
import { TextLink } from './nav';

/**
 * The guide for whichever page this is, above the page itself.
 *
 * Rendered from `PageHeader` and from the member frame rather than from each
 * page, so a page gets its guide by being at a route the registry knows —
 * `layout/section-guides.ts` is the only place to edit.
 *
 * **Folded, always.** It used to open the first time and remember being
 * hidden, which sounds considerate and is not: an operator who works here
 * every day was handed a card to dismiss on every page they had not visited
 * since, while the figures they came for sat below the fold. One line and a
 * **Read** button is enough of an offer — somebody who wants the guide opens
 * it, and somebody opening the panel for the first time has the whole thing
 * in the sidebar.
 *
 * Which also means there is nothing in the browser's storage to read, so no
 * `NoSsr` boundary and no card that unfolds and folds itself shut a frame
 * later: the server renders it closed because closed is what it always is.
 */
export function SectionGuide() {
  const guide = guideFor(usePathname());
  if (!guide) return null;

  return (
    /* Keyed, so opening the guide on one page does not leave it open on the
       next: the offer starts folded wherever it is made. */
    <GuideCard key={guide.pattern} guide={guide} />
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen(current => !current), []);

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
