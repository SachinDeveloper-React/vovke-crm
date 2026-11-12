'use client';

import { useSyncExternalStore } from 'react';

import { useColorScheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { canInstall, canInstallOnServer, promptInstall, subscribeInstall } from '@/src/components/pwa/install-store';
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
  const { mode, systemMode, setMode } = useColorScheme();
  // `system` is a mode too: what is on screen is then the OS's choice.
  const shown = mode === 'system' ? systemMode : mode;
  const installable = useSyncExternalStore(subscribeInstall, canInstall, canInstallOnServer);
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

      {installable && (
        <Tooltip title="Install the panel as an app — its own window and icon">
          <Button
            size="small"
            color="inherit"
            onClick={() => promptInstall()}
            startIcon={<Iconify icon="solar:download-minimalistic-bold-duotone" />}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Install
          </Button>
        </Tooltip>
      )}

      <Tooltip title={shown === 'dark' ? 'Light mode' : 'Dark mode'}>
        <IconButton onClick={() => setMode(shown === 'dark' ? 'light' : 'dark')} aria-label="Toggle color scheme">
          <Iconify icon={shown === 'dark' ? 'solar:sun-bold-duotone' : 'solar:moon-bold-duotone'} />
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
