'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Iconify } from '@/src/components/iconify/iconify';
// Straight from the module rather than the `components/ui` barrel: the
// barrel also exports `ApiErrorNotice`, which reaches `lib/api.ts` and its
// `server-only` import — and a client component pulling that in is a build
// error, not a dead import that gets shaken out.
import { LinkButton, TextLink } from '@/src/components/ui/nav';
import { guidesByGroup, type SectionGuide } from '@/src/layout/section-guides';

/** `/dashboard/users/:userId/coins` → something that can be opened. */
function exampleHrefOf(pattern: string): string | null {
  // A pattern with a parameter in it has no page of its own to open: a
  // member tab needs a member, and sending somebody to `/users/:userId`
  // would be a 404 dressed as a link. Those rows name where they are
  // reached from instead.
  return pattern.includes('/:') ? null : pattern;
}

/** An anchor id that survives being read out of the contents list. */
const anchorOf = (pattern: string) => pattern.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

function matches(guide: SectionGuide, needle: string): boolean {
  if (needle === '') return true;
  const haystack = [
    guide.title,
    guide.question,
    guide.what,
    guide.group,
    ...guide.how,
    ...guide.writes,
    ...guide.careful,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

/**
 * The whole panel explained, in the sidebar's own order.
 *
 * The same text each page carries at the top of itself, gathered in one
 * place, because the two readers want it two different ways: somebody using
 * a page wants the guide for that page, and somebody being handed the panel —
 * a new operator, or somebody who runs a different CRM and has to work this
 * one — wants to read it through and find out what is here at all.
 *
 * A client component for the search box alone. There is nothing to fetch:
 * every word of it is in `layout/section-guides.ts`, which is also the only
 * file to edit when a page changes.
 */
export function GuideView() {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      guidesByGroup()
        .map(entry => ({
          group: entry.group,
          guides: entry.guides.filter(guide => matches(guide, needle)),
        }))
        .filter(entry => entry.guides.length > 0),
    [needle],
  );

  const found = groups.reduce((total, entry) => total + entry.guides.length, 0);

  return (
    <Stack spacing={3}>
      <Card variant="outlined" sx={{ flexShrink: 0, p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Every page of this panel, in the order the sidebar asks the
            questions: what it is, how it is used, what can be changed from it,
            and what it refuses. The same guide sits at the top of each page,
            where it can be hidden once it has been read.
          </Typography>

          <TextField
            size="small"
            fullWidth
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search the guide — refund, coupon, quiet hours, verified…"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                  </InputAdornment>
                ),
              },
            }}
          />

          {needle === '' ? (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              }}
            >
              {groups.map(entry => (
                <Box key={entry.group} sx={{ minWidth: 0 }}>
                  <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                    {entry.group}
                  </Typography>
                  <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                    {entry.guides.map(guide => (
                      <TextLink key={guide.pattern} href={`#${anchorOf(guide.pattern)}`} variant="body2">
                        {guide.title}
                      </TextLink>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {found === 0
                ? 'Nothing in the guide mentions that.'
                : `${found} page${found === 1 ? '' : 's'} mention that.`}
            </Typography>
          )}
        </Stack>
      </Card>

      {groups.map(entry => (
        <Stack key={entry.group} spacing={2}>
          <Typography variant="h6">{entry.group}</Typography>
          {entry.guides.map(guide => (
            <GuideCard key={guide.pattern} guide={guide} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function GuideCard({ guide }: { guide: SectionGuide }) {
  const href = exampleHrefOf(guide.pattern);

  return (
    <Card id={anchorOf(guide.pattern)} sx={{ flexShrink: 0, scrollMarginTop: 96 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ px: 3, pt: 2.5, pb: 1.5, alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6">{guide.title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            {guide.question}
          </Typography>
        </Box>
        {href ? (
          <LinkButton href={href} size="small" color="inherit" variant="outlined">
            Open it
          </LinkButton>
        ) : (
          // A member tab, an order, a coupon code: reached by opening the
          // thing it is about, which is worth saying rather than leaving a
          // row looking like a link that failed.
          <Chip size="small" variant="outlined" label="Opened from a row" sx={{ flexShrink: 0 }} />
        )}
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack spacing={2.5} sx={{ px: 3, py: 2.5 }}>
        <Typography variant="body2">{guide.what}</Typography>

        <Block title="How it is used" icon="solar:list-check-bold-duotone" items={guide.how} ordered />

        <Block
          title="What you can change here"
          icon="solar:pen-new-square-bold-duotone"
          items={guide.writes.length > 0 ? guide.writes : ['Nothing — this page only reads.']}
        />

        <Block
          title="Worth knowing before you act"
          icon="solar:danger-triangle-bold-duotone"
          items={guide.careful}
          tone="warning"
        />
      </Stack>
    </Card>
  );
}

function Block({
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
    <Box
      sx={{
        minWidth: 0,
        borderRadius: 1,
        p: 1.5,
        bgcolor: theme => alpha(theme.palette[tone].main, 0.04),
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
        <Iconify icon={icon} width={18} sx={{ color: `${tone}.main` }} />
        <Typography variant="subtitle2">{title}</Typography>
      </Stack>
      <Box component={ordered ? 'ol' : 'ul'} sx={{ m: 0, pl: 3, display: 'grid', gap: 0.75 }}>
        {items.map(item => (
          <Typography key={item} component="li" variant="body2" sx={{ color: 'text.secondary' }}>
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
