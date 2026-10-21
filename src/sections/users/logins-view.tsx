import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Mono, Panel, SelectFilter } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, dateTime, number } from '@/src/lib/format';
import type { LoginRow, Page } from '@/src/lib/types';

/**
 * Every sign-in, newest first, across every install.
 *
 * Read from the counting periods each install keeps — the same record the
 * step rules are judged against, which is why a period still open reads as
 * "signed in now" rather than as a missing sign-out.
 */
export async function MemberLogins({ userId, limit }: { userId: string; limit: number }) {
  const logins = await adminGet<Page<LoginRow>>(`/admin/users/${encodeURIComponent(userId)}/logins`, { limit });

  return (
    <Panel
      title="Sign-ins"
      subtitle={`${number(logins.data.length)} shown of ${number(logins.total ?? logins.data.length)} recorded · newest first`}
      note="A sign-in opens a counting period and a sign-out closes it (D-56). Steps are only counted inside an open period, which is why this list is also the record the step rules are judged against."
      action={
        <SelectFilter
          label="Show"
          param="limit"
          value={String(limit)}
          options={[50, 100, 200].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={130}
        />
      }
      dense
    >
      <DataTable
        columns={[
          { label: 'Signed in' },
          { label: 'Until' },
          { label: 'Phone' },
          { label: 'Build' },
          { label: 'Install', align: 'right' },
        ]}
        rows={logins.data.map((login, index) => ({
          key: `${login.deviceId}-${login.at}-${index}`,
          cells: [
            <Stack key="at" spacing={0.25}>
              <Typography variant="body2">{dateTime(login.at)}</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {ago(login.at)}
              </Typography>
            </Stack>,
            login.open ? (
              <Label key="open" color="success" variant="soft">
                still signed in
              </Label>
            ) : (
              <Stack key="until" spacing={0.25}>
                <Typography variant="body2">{dateTime(login.until)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {ago(login.until)}
                </Typography>
              </Stack>
            ),
            <Stack key="phone" spacing={0.25}>
              <Typography variant="body2">{login.model ?? '—'}</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {login.platform === 'ios' ? 'iOS' : 'Android'} {login.osVersion ?? ''}
              </Typography>
            </Stack>,
            login.appVersion ?? '—',
            <Mono key="device">{login.deviceId}</Mono>,
          ],
        }))}
        empty="This account has never signed in on a phone."
      />
    </Panel>
  );
}
