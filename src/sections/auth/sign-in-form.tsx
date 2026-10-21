'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { signIn, type SignInState } from '@/src/lib/session';

/**
 * Signing in is proving you hold the operator's key.
 *
 * There is no admin account to log into: the API's admin surface answers one
 * key and no member token, however that member token was obtained. So the key
 * is the credential — checked against the API before it is stored, and stored
 * in an httpOnly cookie that no script in this page can read.
 */
export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <Stack component="form" action={action} spacing={2.5}>
      {state.error && (
        <Alert severity="error" variant="outlined">
          {state.error}
        </Alert>
      )}

      <TextField
        name="key"
        label="Admin key"
        type="password"
        autoFocus
        autoComplete="off"
        required
        disabled={pending}
        placeholder="The ADMIN_API_KEY the API was started with"
        slotProps={{ htmlInput: { spellCheck: false } }}
      />

      <Button
        type="submit"
        size="large"
        variant="contained"
        loading={pending}
        startIcon={<Iconify icon="solar:login-3-bold-duotone" />}
      >
        Open the panel
      </Button>

      <Box sx={{ pt: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          The key is sent to the API once to check it, then kept in an httpOnly cookie for twelve hours. It never
          reaches the browser&apos;s own scripts, and no request from this panel is made anywhere but your API.
        </Typography>
      </Box>
    </Stack>
  );
}
