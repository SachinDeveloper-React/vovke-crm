import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export type KvItem = { label: string; value: ReactNode; hint?: string };

/** Label on the left, answer on the right — an account, an install, a day. */
export function Kv({ items, columns = 1 }: { items: KvItem[]; columns?: 1 | 2 }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: `repeat(${columns}, minmax(0, 1fr))` },
        columnGap: 4,
      }}
    >
      {items.map(item => (
        <Stack
          key={item.label}
          direction="row"
          spacing={2}
          sx={{
            py: 1,
            alignItems: 'baseline',
            justifyContent: 'space-between',
            borderBottom: '1px dashed',
            borderColor: 'divider',
            '&:last-of-type': { borderBottom: 'none' },
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
            {item.label}
          </Typography>
          <Box sx={{ textAlign: 'right', minWidth: 0 }}>
            <Typography variant="body2" component="div" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
              {item.value}
            </Typography>
            {item.hint && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {item.hint}
              </Typography>
            )}
          </Box>
        </Stack>
      ))}
    </Box>
  );
}
