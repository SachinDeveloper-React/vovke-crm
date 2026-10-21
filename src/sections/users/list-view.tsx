import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  FilterBar,
  LinkButton,
  Mono,
  OffsetPager,
  Panel,
  RowLink,
  SearchFilter,
  SelectFilter,
  TrustChip,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, dateTime, number, shortId } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { Page, UserRow } from '@/src/lib/types';

export type UsersListQuery = {
  q: string;
  limit: number;
  offset: number;
  tier: string;
  platform: string;
  status: string;
  sort: string;
};

/**
 * Finding the account, by whatever support was actually given: an id, an
 * email, a phone, or part of a name. An empty search lists the newest
 * accounts, because "the member who just signed up" is the commonest thing
 * being looked for.
 *
 * The filters are the ones a list is actually narrowed by — a state, a tier,
 * a platform — and every one of them is in the URL, so a narrowed list is a
 * link you can send to whoever has to deal with it.
 */
export async function UsersListView({ query }: { query: UsersListQuery }) {
  const users = await adminGet<Page<UserRow>>('/admin/users', {
    q: query.q,
    limit: query.limit,
    offset: query.offset,
    tier: query.tier || undefined,
    platform: query.platform || undefined,
    status: query.status || undefined,
    sort: query.sort,
  });
  const total = users.total ?? users.data.length;

  return (
    <Stack spacing={3}>
      <FilterBar>
        <SearchFilter value={query.q} placeholder="Id, email, phone, or part of a name" />
        <SelectFilter
          label="State"
          param="status"
          value={query.status}
          options={[
            { value: '', label: 'Everyone' },
            { value: 'frozen', label: 'Frozen' },
            { value: 'unverified', label: 'Unverified' },
            { value: 'deleting', label: 'Deletion scheduled' },
            { value: 'deleted', label: 'Deleted' },
          ]}
          width={170}
        />
        <SelectFilter
          label="Trust"
          param="tier"
          value={query.tier}
          options={[
            { value: '', label: 'Any tier' },
            ...['trusted', 'normal', 'watch', 'restricted', 'banned'].map(value => ({ value, label: value })),
          ]}
          width={130}
        />
        <SelectFilter
          label="Platform"
          param="platform"
          value={query.platform}
          options={[
            { value: '', label: 'Any phone' },
            { value: 'android', label: 'Android' },
            { value: 'ios', label: 'iOS' },
          ]}
          width={130}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'name', label: 'By name' },
            { value: 'trust', label: 'Lowest trust' },
          ]}
          width={150}
        />
        <SelectFilter
          label="Show"
          param="limit"
          value={String(query.limit)}
          options={[20, 50, 100].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={120}
        />
      </FilterBar>

      <Panel
        title={`${number(total)} member${total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : 'newest first'}
        dense
      >
        <DataTable
          columns={[
            { label: 'Member' },
            { label: 'Phone' },
            { label: 'Trust' },
            { label: 'State' },
            { label: 'Running' },
            { label: 'Last seen', align: 'right' },
            { label: '', align: 'right', width: 110 },
          ]}
          rows={users.data.map(user => ({
            key: user.id,
            tone: user.deleted || user.frozen ? 'danger' : 'default',
            cells: [
              <Stack key="who" spacing={0.25}>
                <RowLink href={paths.dashboard.users.detail(user.id)}>{user.name || 'No name yet'}</RowLink>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {user.email}
                  {user.emailVerified ? ' ✓' : ' · unverified'}
                </Typography>
                <Mono>{shortId(user.id, 8)}</Mono>
              </Stack>,
              <Stack key="phone" spacing={0.25}>
                <Typography variant="body2">{user.phone}</Typography>
                <Typography variant="caption" sx={{ color: user.phoneVerified ? 'success.main' : 'text.disabled' }}>
                  {user.phoneVerified ? 'verified' : 'unverified'}
                  {user.country ? ` · ${user.country}` : ''}
                </Typography>
              </Stack>,
              <TrustChip key="trust" tier={user.trust.tier} score={user.trust.score} />,
              <Stack key="state" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {user.deleted && (
                  <Label color="error" variant="soft">
                    deleted
                  </Label>
                )}
                {user.frozen && (
                  <Label color="error" variant="soft">
                    frozen
                  </Label>
                )}
                {user.legalHold && (
                  <Label color="warning" variant="soft">
                    legal hold
                  </Label>
                )}
                {user.deletionScheduledAt && !user.deleted && (
                  <Label color="warning" variant="soft">
                    deleting {ago(user.deletionScheduledAt)}
                  </Label>
                )}
                {!user.deleted && !user.frozen && !user.legalHold && !user.deletionScheduledAt && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    fine
                  </Typography>
                )}
              </Stack>,
              <Stack key="running" spacing={0.25}>
                <Typography variant="body2">
                  {user.platform === 'ios' ? 'iOS' : user.platform === 'android' ? 'Android' : '—'}
                  {user.appVersion ? ` · ${user.appVersion}` : ''}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {number(user.devices)} install{user.devices === 1 ? '' : 's'} · installed {ago(user.installedAt)}
                </Typography>
              </Stack>,
              <Stack key="seen" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{ago(user.lastSeenAt)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {dateTime(user.lastSeenAt)}
                </Typography>
              </Stack>,
              <LinkButton key="open" href={paths.dashboard.users.detail(user.id)} size="small" variant="outlined">
                Open
              </LinkButton>,
            ],
          }))}
          empty={
            query.q || query.status || query.tier || query.platform
              ? 'Nothing matches those filters.'
              : 'No account has been created yet.'
          }
        />
        <OffsetPager total={total} offset={users.offset ?? query.offset} limit={users.limit ?? query.limit} />
      </Panel>

      <Box>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          “Installed” is when this account first registered a phone, which is not the sign-up. “Last seen” is the
          newest request from any of their installs, written at most once every five minutes. Filtering by platform
          means “has a live install on it”, since a platform belongs to a phone rather than to an account.
        </Typography>
      </Box>
    </Stack>
  );
}
