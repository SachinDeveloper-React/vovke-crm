import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LinkButton, Panel } from '@/src/components/ui';
import { paths } from '@/src/layout/paths';

/**
 * No such account.
 *
 * Its own boundary rather than the dashboard's, because a member page is the
 * one most often reached by a saved link — and because the next thing to do
 * is always the same: search for them by what support was actually given,
 * which is an email or a phone number rather than an id.
 *
 * Deliberately *not* inside `DashboardContent`: the member layout above this
 * already provides it, and nesting a second one would indent the page.
 */
export default function MemberNotFound() {
  return (
    <Panel title="No such account">
      <Stack spacing={2}>
        <Alert severity="info" variant="outlined">
          <AlertTitle sx={{ mb: 0.5 }}>The API holds no member with that id</AlertTitle>
          <Typography variant="body2">
            Either the account has been deleted outright — a deletion that has run past its grace period leaves
            nothing behind (RULES P5) — or the id belongs to a different database. Development ids do not survive a
            restart of the in-memory server.
          </Typography>
        </Alert>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Search by whatever support was given: an email, a phone number, or part of a name. The list also finds
          accounts that are frozen, unverified or being deleted, which an id-only lookup cannot tell you apart.
        </Typography>
        <Stack direction="row" spacing={1}>
          <LinkButton href={paths.dashboard.users.root} variant="contained" size="small">
            Find a member
          </LinkButton>
        </Stack>
      </Stack>
    </Panel>
  );
}
