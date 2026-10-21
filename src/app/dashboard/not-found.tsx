import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LinkButton, PageHeader, Panel } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { paths } from '@/src/layout/paths';

/**
 * The thing being asked about is not there.
 *
 * Rendered whenever an admin read answers 404 for its subject — a member who
 * has been deleted, an order id typed wrong, a link from a database that has
 * since been replaced. It is inside the dashboard's own layout on purpose:
 * the nav stays, so the answer to "that is gone" is one click rather than
 * the browser's back button.
 */
export default function NotFound() {
  return (
    <DashboardContent maxWidth="lg">
      <PageHeader title="Not here" subtitle="The API has no record of what this page was asked to open." />
      <Panel title="What this usually means">
        <Stack spacing={2}>
          <Alert severity="info" variant="outlined">
            <AlertTitle sx={{ mb: 0.5 }}>The id in the address does not exist</AlertTitle>
            <Typography variant="body2">
              An account that has since been deleted, an id that was mistyped, or a link saved from a different
              database — a development one that has been restarted, for instance, since every id in it was new.
            </Typography>
          </Alert>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nothing has gone wrong with the panel or the API: this is the API answering that it holds no such record.
            Search for it instead, from whichever list it belongs to.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <LinkButton href={paths.dashboard.users.root} variant="contained" size="small">
              Find a member
            </LinkButton>
            <LinkButton href={paths.dashboard.orders} variant="outlined" size="small" color="inherit">
              The order book
            </LinkButton>
            <LinkButton href={paths.dashboard.catalogue} variant="outlined" size="small" color="inherit">
              The catalogue
            </LinkButton>
            <LinkButton href={paths.dashboard.support} variant="outlined" size="small" color="inherit">
              Support queue
            </LinkButton>
            <LinkButton href={paths.dashboard.root} variant="outlined" size="small" color="inherit">
              Analytics
            </LinkButton>
          </Stack>
        </Stack>
      </Panel>
    </DashboardContent>
  );
}
