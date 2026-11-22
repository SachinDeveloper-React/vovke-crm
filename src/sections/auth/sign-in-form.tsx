'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { signIn, signInWithKey, type SignInState } from '@/src/lib/session';

/**
 * Signing in (RULES Z9). Everybody who runs VOKVE — admin, manager, agent —
 * has their own account: email, password, and the six digits from their
 * authenticator app. What each of them can then see and do is their
 * permissions, which the API checks on every call.
 *
 * Below it, folded away, the owner's recovery door: the API's admin key, for
 * the day every admin account is locked out.
 */
export function SignInForm() {
  const [recovery, setRecovery] = useState(false);
  return (
    <Stack spacing={2.5}>
      {recovery ? <KeyForm /> : <StaffForm />}
      <Divider />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {recovery ? (
          <>
            Signing in as a person?{' '}
            <Link component="button" type="button" variant="caption" onClick={() => setRecovery(false)}>
              Use your email and password
            </Link>
          </>
        ) : (
          <>
            Owner locked out of every admin account?{' '}
            <Link component="button" type="button" variant="caption" onClick={() => setRecovery(true)}>
              Sign in with the admin key
            </Link>
          </>
        )}
      </Typography>
    </Stack>
  );
}

function StaffForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  return (
    <Stack component="form" action={action} spacing={2.5}>
      {state.error && (
        <Alert severity="error" variant="outlined">
          {state.error}
        </Alert>
      )}
      <TextField name="email" label="Work email" type="email" autoComplete="username" autoFocus required disabled={pending} />
      <TextField name="password" label="Password" type="password" autoComplete="current-password" required disabled={pending} />
      <TextField
        name="code"
        label="Authenticator code"
        autoFocus={state.needsCode}
        autoComplete="one-time-code"
        required={state.needsCode}
        disabled={pending}
        placeholder="123456"
        helperText="The six digits in your authenticator app. Leave empty on your very first sign-in."
        slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6, spellCheck: false } }}
      />
      <Button type="submit" size="large" variant="contained" loading={pending} startIcon={<Iconify icon="solar:login-3-bold-duotone" />}>
        Sign in
      </Button>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          No account yet? Your manager or an admin creates it and gives you a temporary password; you choose your own on first sign-in.
          Forgotten it? Ask them to reset it.
        </Typography>
      </Box>
    </Stack>
  );
}

function KeyForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInWithKey, {});
  return (
    <Stack component="form" action={action} spacing={2.5}>
      <Alert severity="warning" variant="outlined">
        The admin key opens everything, as the owner. Use it only to recover access — every use is on the activity log.
      </Alert>
      {state.error && (
        <Alert severity="error" variant="outlined">
          {state.error}
        </Alert>
      )}
      <TextField
        name="key"
        label="Admin key"
        type="password"
        autoFocus={!state.needsCode}
        autoComplete="off"
        required
        disabled={pending}
        placeholder="The ADMIN_API_KEY the API was started with"
        slotProps={{ htmlInput: { spellCheck: false } }}
      />
      <TextField
        name="code"
        label="Key authenticator code"
        autoFocus={state.needsCode}
        autoComplete="one-time-code"
        required={state.needsCode}
        disabled={pending}
        placeholder="123456"
        helperText="Only once ADMIN_TOTP_SECRET is set on the API."
        slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6, spellCheck: false } }}
      />
      <Button type="submit" size="large" variant="outlined" color="warning" loading={pending} startIcon={<Iconify icon="solar:key-bold-duotone" />}>
        Open as owner
      </Button>
    </Stack>
  );
}
