'use client';

import { useColorScheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { signOut } from '@/src/lib/session';

/**
 * The header's right side: which API this panel is pointed at, the color
 * scheme, and the way out.
 *
 * The API's address is on screen on purpose. Every figure in here is read
 * from one server, and "I was looking at staging" is the first thing to rule
 * out when two people disagree about a number.
 */
export function RightArea({ apiBase, timezone }: { apiBase: string; timezone: string }) {
  const { mode, setMode } = useColorScheme();
  const host = (() => {
    try {
      return new URL(apiBase).host;
    } catch {
      return apiBase;
    }
  })();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
      <Tooltip title={`Reading ${apiBase} · days bucketed in ${timezone}`}>
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 0.75,
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'var(--font-geist-mono)' }}>
            {host}
          </Typography>
        </Box>
      </Tooltip>

      <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
        <IconButton onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} aria-label="Toggle color scheme">
          <Iconify icon={mode === 'dark' ? 'solar:sun-bold-duotone' : 'solar:moon-bold-duotone'} />
        </IconButton>
      </Tooltip>

      <Box component="form" action={signOut}>
        <Button type="submit" size="small" color="inherit" startIcon={<Iconify icon="solar:logout-3-bold-duotone" />}>
          Sign out
        </Button>
      </Box>
    </Box>
  );
}

export default RightArea;
