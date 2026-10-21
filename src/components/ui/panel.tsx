import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * One answer per card, with the question as its title.
 *
 * `note` is where a figure's provenance goes — which collection it came from,
 * what it excludes — because a number whose source is a mystery gets argued
 * with rather than acted on.
 */
export function Panel({
  title,
  subtitle,
  note,
  action,
  children,
  dense = false,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  dense?: boolean;
}) {
  return (
    // Two rules, and the reason for each is the layout above this card.
    //
    // **It must not shrink.** The dashboard is a column of flex boxes up to
    // a root that is the viewport's own height, so once a page is taller
    // than the window every card in it is a flex item being asked to
    // shrink — and MUI's `Card` is `overflow: hidden`, so what it gives up
    // is not scrolled, it is *gone*: a table's last row sliced through the
    // middle with no way to reach it.
    //
    // **It fills its parent only when that parent is a grid row.** Matching
    // the card beside it is the whole point there, and the row's height is
    // what `100%` means. In a vertical `Stack` the parent is the entire
    // stack, so the same `height: 100%` made one card as tall as the page —
    // which is what the shrink above had been quietly undoing.
    <Card
      sx={{
        flexShrink: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        '.MuiGrid-root > &': { height: '100%' },
      }}
    >
      {(title || action) && (
        <Stack
          direction="row"
          spacing={2}
          sx={{ px: 3, pt: 2.5, pb: subtitle ? 0.5 : 2, alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Stack>
      )}
      <Box sx={{ px: dense ? 0 : 3, pb: dense ? 0 : 2.5, pt: title ? 1.5 : 2.5, flex: 1, minWidth: 0 }}>{children}</Box>
      {note && (
        <Typography variant="caption" sx={{ color: 'text.disabled', px: 3, pb: 2, display: 'block' }}>
          {note}
        </Typography>
      )}
    </Card>
  );
}
