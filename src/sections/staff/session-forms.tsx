'use client';

import { useActionState } from 'react';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { endMySession, type FormState } from '@/src/lib/session';

/** Signs one of one's own other browsers out. */
export function EndSessionButton({ sessionId }: { sessionId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(endMySession, {});
  return (
    <Stack component="form" action={action} spacing={0.5} sx={{ alignItems: 'flex-end' }}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <Button type="submit" size="small" color="error" loading={pending}>
        Sign out
      </Button>
      {state.error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {state.error}
        </Typography>
      )}
    </Stack>
  );
}
