import { Suspense } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { LinkButton } from '@/src/components/ui';
import { currentStaff } from '@/src/lib/api';
import { DashboardContent } from '@/src/layout/dashboard/main';
import type { SearchParams } from '@/src/lib/search-params';

export const metadata = { title: 'No access · Vokve Admin' };

/**
 * Where a page this person may not open sends them (RULES Z9): which
 * permission it needs, and who to ask — their manager, or an admin.
 */
export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="sm">
      <Suspense fallback={null}>
        <Body search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Body({ search }: { search: Promise<SearchParams> }) {
  const [params, me] = await Promise.all([search, currentStaff()]);
  const need = typeof params.need === 'string' ? params.need : '';
  const ask = me?.role === 'agent' ? `your manager${me.manager ? `, ${me.manager.name},` : ''}` : 'an admin';
  return (
    <Card sx={{ p: 4, mt: 6 }}>
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Iconify icon="solar:lock-keyhole-bold-duotone" width={40} sx={{ color: 'warning.main' }} />
        <Typography variant="h5">You do not have access to that page</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {need ? (
            <>
              It needs the <b>{need}</b> permission, which your account does not hold.
            </>
          ) : (
            'Your account does not hold the permission that page needs.'
          )}{' '}
          Ask {ask} if your work needs it.
        </Typography>
        <LinkButton href="/dashboard" variant="contained" size="small">
          Go to my first page
        </LinkButton>
      </Stack>
    </Card>
  );
}
