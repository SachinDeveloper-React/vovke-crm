import { Suspense } from 'react';

import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Logo } from '@/src/components/logo';
import { API_BASE } from '@/src/lib/api';
import type { SearchParams } from '@/src/lib/search-params';
import { SignInForm } from '@/src/sections/auth/sign-in-form';

export const metadata = { title: 'Sign in · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Card sx={{ p: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Logo disableLink width={160} height={40} />

        <Stack spacing={0.5}>
          <Typography variant="h5">The operator&apos;s own surface</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Pointed at{' '}
            <Typography component="span" variant="body2" sx={{ fontFamily: 'var(--font-geist-mono)' }}>
              {API_BASE}
            </Typography>
          </Typography>
        </Stack>

        <Suspense fallback={null}>
          <Notice search={searchParams} />
        </Suspense>

        <SignInForm />
      </Stack>
    </Card>
  );
}

/** Why they are here, when they did not come here on purpose. */
async function Notice({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  if (params.from !== 'expired') return null;
  return (
    <Alert severity="info" variant="outlined">
      That session has run out, or the key was changed on the API. Sign in again.
    </Alert>
  );
}
