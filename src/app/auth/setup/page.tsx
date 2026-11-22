import { Suspense } from 'react';

import { redirect } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Logo } from '@/src/components/logo';
import { currentStaff } from '@/src/lib/api';
import { signOut } from '@/src/lib/session';
import { AuthenticatorSetup, PasswordForm } from '@/src/sections/auth/setup-forms';

export const metadata = { title: 'Set up your account · Vokve Admin' };

/**
 * First sign-in (RULES Z9): the temporary password is replaced, and an
 * authenticator is enrolled, before the dashboard opens. The API refuses
 * every other route to a session in this state, so this page is not a
 * suggestion.
 */
export default function Page() {
  return (
    <Card sx={{ p: { xs: 3, sm: 4 } }}>
      <Suspense fallback={null}>
        <Steps />
      </Suspense>
    </Card>
  );
}

async function Steps() {
  const me = await currentStaff();
  if (!me) redirect('/auth/sign-in?from=expired');
  if (me.kind === 'root' || (!me.setup.changePassword && !me.setup.enrollTotp)) redirect('/dashboard');

  const step = me.setup.changePassword ? 1 : 2;
  return (
    <Stack spacing={3}>
      <Logo disableLink width={160} height={40} />
      <Stack spacing={0.5}>
        <Typography variant="overline" sx={{ color: 'text.disabled' }}>
          Step {step} of 2
        </Typography>
        <Typography variant="h5">{step === 1 ? 'Choose your own password' : 'Set up your authenticator'}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Welcome, {me.name}. {step === 1
            ? 'The password you were given was temporary — only you should know the one you use.'
            : 'Every sign-in will ask for the six digits it shows, so a stolen password alone is not enough.'}
        </Typography>
      </Stack>
      {step === 1 ? <PasswordForm setup /> : <AuthenticatorSetup />}
      <Alert severity="info" variant="outlined">
        Signed in as {me.email} ({me.role}). Not you?{' '}
        <Box component="form" action={signOut} sx={{ display: 'inline' }}>
          <Button type="submit" size="small" variant="text" sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline' }}>
            Sign out
          </Button>
        </Box>
      </Alert>
    </Stack>
  );
}
