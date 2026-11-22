'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import {
  changeMyPassword, confirmAuthenticator, setupPassword, startAuthenticator, type AuthenticatorState, type FormState,
} from '@/src/lib/session';

/**
 * A new password. On the setup page the current one is the temporary
 * password somebody handed over; on My account it is the member of staff's
 * own. Same API call either way (it signs out every other session).
 */
export function PasswordForm({ setup = false }: { setup?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setup ? setupPassword : changeMyPassword, {});
  return (
    <Stack component="form" action={action} spacing={2}>
      {state.ok && <Alert severity="success" variant="outlined">{state.ok}</Alert>}
      {state.error && <Alert severity="error" variant="outlined">{state.error}</Alert>}
      <TextField
        name="currentPassword"
        label={setup ? 'Temporary password' : 'Current password'}
        type="password"
        autoComplete="current-password"
        required
        disabled={pending}
        size="small"
      />
      <TextField
        name="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        disabled={pending}
        size="small"
        helperText="At least 10 characters, with a letter and a number."
      />
      <TextField name="confirmPassword" label="New password again" type="password" autoComplete="new-password" required disabled={pending} size="small" />
      <Box>
        <Button type="submit" variant="contained" loading={pending}>
          {setup ? 'Save and continue' : 'Change password'}
        </Button>
      </Box>
    </Stack>
  );
}

/**
 * Enrolling an authenticator: ask for a secret, scan it, type a code back.
 * The secret is pending on the server until that code matches, so a QR
 * nobody scanned leaves nothing behind.
 */
export function AuthenticatorSetup() {
  const [started, start, starting] = useActionState<AuthenticatorState>(startAuthenticator, {});
  const [confirmed, confirm, confirming] = useActionState<AuthenticatorState, FormData>(confirmAuthenticator, {});
  const shown = started.qr ? started : null;

  if (!shown) {
    return (
      <Stack component="form" action={start} spacing={2}>
        {started.error && <Alert severity="error" variant="outlined">{started.error}</Alert>}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Install Google Authenticator, Microsoft Authenticator or 1Password on your phone, then press the button to get your QR code.
        </Typography>
        <Box>
          <Button type="submit" variant="contained" loading={starting} startIcon={<Iconify icon="solar:shield-keyhole-bold-duotone" />}>
            Show my QR code
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: 'center' }}>
        <Box
          component="img"
          src={shown.qr}
          alt="QR code to add VOKVE Staff to an authenticator app"
          sx={{ width: 180, height: 180, bgcolor: '#fff', p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
        />
        <Stack spacing={1} sx={{ minWidth: 0 }}>
          <Typography variant="body2">Scan it with the app. Can&apos;t scan? Choose &ldquo;enter a setup key&rdquo; and type:</Typography>
          <Typography variant="subtitle2" sx={{ fontFamily: 'var(--font-geist-mono)', wordBreak: 'break-all', letterSpacing: 1 }}>
            {shown.secret?.replace(/(.{4})/g, '$1 ').trim()}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Time-based, 6 digits. It shows up as &ldquo;VOKVE Staff&rdquo;.
          </Typography>
        </Stack>
      </Stack>
      <Stack component="form" action={confirm} spacing={2}>
        {confirmed.error && <Alert severity="error" variant="outlined">{confirmed.error}</Alert>}
        <TextField
          name="code"
          label="The code the app shows now"
          autoFocus
          autoComplete="one-time-code"
          required
          disabled={confirming}
          size="small"
          slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6 } }}
        />
        <Box>
          <Button type="submit" variant="contained" loading={confirming}>
            Turn it on
          </Button>
        </Box>
      </Stack>
    </Stack>
  );
}
