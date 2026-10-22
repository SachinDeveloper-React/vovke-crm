import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SectionGuide } from './section-guide';

/**
 * The title block every page opens with, and the filters that belong to it.
 *
 * The section guide hangs off it rather than off each page: this is the one
 * component every titled page already renders, so a page gets its guide by
 * being at a route `layout/section-guides.ts` knows about and no page has to
 * be edited to grow one. The member tabs have no title block of their own and
 * render it from their frame instead.
 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, mt: 2, alignItems: { md: 'flex-end' }, justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ mb: subtitle ? 0.5 : 0 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Stack>
      <SectionGuide />
    </>
  );
}
