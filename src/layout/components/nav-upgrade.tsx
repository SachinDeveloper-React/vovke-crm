'use client';

import type { ComponentProps } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
import { useStaff } from '@/src/components/staff/staff-context';
import { CONFIG } from '@/src/config-global';

type NavUpgradeProps = Omit<ComponentProps<typeof Stack>, 'sx'> & {
  sx?: ComponentProps<typeof Stack>['sx'];
};

/**
 * Who this session is, at the foot of the sidebar (RULES Z9): the person,
 * their role, who they answer to, and how much of the panel is theirs —
 * the first thing to check when a page says "you do not have permission".
 */
export function NavUpgrade({ sx, ...other }: NavUpgradeProps) {
  const { me } = useStaff();
  const root = me?.kind === 'root';
  const title = !me ? 'Signed in' : root ? 'Owner key' : me.name;
  const detail = !me
    ? ''
    : root
      ? 'Break-glass access: everything is open, and every use is on the activity log. Sign in with your own account day to day.'
      : me.role === 'admin'
        ? 'Admin — every page and action, and the whole team.'
        : `${me.effectivePermissions.length} permissions${me.manager ? ` · reports to ${me.manager.name}` : ''}. Every action is on the activity log.`;
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
          <Iconify icon={root ? 'solar:key-minimalistic-square-bold-duotone' : 'solar:user-id-bold-duotone'} width={18} />
          <Typography variant="subtitle2" noWrap sx={{ color: 'var(--layout-nav-text-primary-color)', minWidth: 0 }}>
            {title}
          </Typography>
          {me && (
            <Label color={root ? 'warning' : me.role === 'admin' ? 'error' : me.role === 'manager' ? 'warning' : 'info'} variant="soft">
              {root ? 'key' : me.role}
            </Label>
          )}
        </Stack>
        <Typography variant="caption" sx={{ color: 'var(--layout-nav-text-disabled-color)', display: 'block' }}>
          {detail}
        </Typography>
        <Typography variant="caption" sx={{ color: 'var(--layout-nav-text-disabled-color)', display: 'block', mt: 1 }}>
          {CONFIG.appName} v{CONFIG.appVersion}
        </Typography>
      </Box>
    </Stack>
  );
}
