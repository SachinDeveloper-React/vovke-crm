import type { ComponentProps } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
import { CONFIG } from '@/src/config-global';

type NavUpgradeProps = Omit<ComponentProps<typeof Stack>, 'sx'> & {
  sx?: ComponentProps<typeof Stack>['sx'];
};

/**
 * What this session is, at the foot of the sidebar.
 *
 * There is no operator account to show a face for — the panel is open because
 * whoever is reading it holds the API's admin key. What is worth saying
 * instead is how much of this surface can change anything: almost none of
 * it. Everything about a member is read-only; the writes are the verdict on a
 * flag, a re-score of a day, and the release decisions.
 */
export function NavUpgrade({ sx, ...other }: NavUpgradeProps) {
  return (
    <Stack
      sx={[{ px: 2, pb: 3, pt: 1 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...other}
    >
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'var(--layout-nav-border-color, rgba(145, 158, 171, 0.12))',
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <Iconify icon="solar:key-minimalistic-square-bold-duotone" width={18} />
          <Typography variant="subtitle2" sx={{ color: 'var(--layout-nav-text-primary-color)' }}>
            Operator session
          </Typography>
          <Label color="success" variant="soft">
            key
          </Label>
        </Stack>
        <Typography variant="caption" sx={{ color: 'var(--layout-nav-text-disabled-color)', display: 'block' }}>
          Read-only, except fraud verdicts, day re-scores and release decisions. Every write is kept in the audit log.
        </Typography>
        <Typography variant="caption" sx={{ color: 'var(--layout-nav-text-disabled-color)', display: 'block', mt: 1 }}>
          {CONFIG.appName} v{CONFIG.appVersion}
        </Typography>
      </Box>
    </Stack>
  );
}
