import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  FilterBar,
  LinkButton,
  Mono,
  OffsetPager,
  OrderStatusChip,
  Panel,
  RowLink,
  SearchFilter,
  SelectFilter,
  Stat,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, coins, dateTime, number, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { OrderQueue } from '@/src/lib/types';

export type OrderQueueQuery = {
  q: string;
  status: string;
  paidWith: string;
  sort: string;
  limit: number;
  offset: number;
};

/**
 * The order book: what needs packing, what is stuck unpaid, what was
 * refunded last week.
 *
 * `paidWith` is the shop's mixed economy as a filter, and it is the one that
 * decides what a row may even show: a coins order has no money to chase, so
 * its row carries coins and no rupee figure at all (RULES R11).
 */
export async function OrderQueueView({ query }: { query: OrderQueueQuery }) {
  const orders = await adminGet<OrderQueue>('/admin/orders', {
    q: query.q,
    status: query.status || undefined,
    paidWith: query.paidWith || undefined,
    sort: query.sort,
    limit: query.limit,
    offset: query.offset,
  });
  const { totals, byStatus, data } = orders;
  const waiting = byStatus.filter(row => ['pending_payment', 'placed', 'confirmed'].includes(row.status));

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Orders matching"
            value={number(orders.total)}
            icon="solar:bag-4-bold-duotone"
            goodDirection="none"
            hint={`${number(waiting.reduce((sum, row) => sum + row.orders, 0))} still to go out`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Money in them" value={rupees(totals.payable, true)} icon="solar:wallet-bold-duotone" goodDirection="none" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Coins in them" value={coins(totals.coinsUsed)} icon="solar:dollar-minimalistic-bold-duotone" goodDirection="none" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Newest"
            value={ago(data[0]?.placedAt)}
            icon="solar:clock-circle-bold-duotone"
            goodDirection="none"
            hint={data[0]?.number ?? 'nothing here'}
          />
        </Grid>
      </Grid>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Order number, id, member id or tracking" />
        <SelectFilter
          label="Status"
          param="status"
          value={query.status}
          options={[
            { value: '', label: 'Every status' },
            ...['pending_payment', 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'].map(value => ({
              value,
              label: `${value.replace(/_/g, ' ')}${byStatus.find(row => row.status === value) ? ` (${byStatus.find(row => row.status === value)?.orders})` : ''}`,
            })),
          ]}
          width={190}
        />
        <SelectFilter
          label="Paid with"
          param="paidWith"
          value={query.paidWith}
          options={[
            { value: '', label: 'Coins or money' },
            { value: 'coins', label: 'Coins only' },
            { value: 'money', label: 'Money only' },
            { value: 'mixed', label: 'Coins + money' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'biggest', label: 'Biggest first' },
          ]}
          width={150}
        />
        <SelectFilter
          label="Show"
          param="limit"
          value={String(query.limit)}
          options={[25, 50, 100].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={120}
        />
      </FilterBar>

      <Panel
        title={`${number(orders.total)} order${orders.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : 'newest first'}
        note="A coins order shows coins and no rupee figure: the paise behind it are the till's conversion, not a bill anybody was sent."
        dense
      >
        <DataTable
          columns={[
            { label: 'Order' },
            { label: 'Member' },
            { label: 'Status' },
            { label: 'Items' },
            { label: 'Paid', align: 'right' },
            { label: 'Placed', align: 'right' },
            { label: '', align: 'right', width: 110 },
          ]}
          rows={data.map(order => {
            const coinsOnly = order.inCoins !== null || (order.coinsUsed > 0 && order.payable === 0);
            const moneyOnly = order.coinsUsed === 0;
            return {
              key: order.id,
              tone: order.status === 'cancelled' || order.status === 'refunded' ? 'danger' : 'default',
              cells: [
                <RowLink key="no" href={paths.dashboard.order(order.id)} secondary={<Mono>{order.id}</Mono>}>
                  {order.number}
                </RowLink>,
                <RowLink key="who" href={paths.dashboard.users.detail(order.member.id)} secondary={order.member.email ?? undefined}>
                  {order.member.name || 'No name yet'}
                </RowLink>,
                <Stack key="status" spacing={0.25}>
                  <OrderStatusChip status={order.status} />
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {order.payment.status ?? 'no payment'}
                    {order.trackingRef ? ` · ${order.trackingRef}` : ''}
                  </Typography>
                </Stack>,
                <Stack key="items" spacing={0.25} sx={{ maxWidth: 200 }}>
                  <Typography variant="body2">{order.firstItem ?? '—'}</Typography>
                  {order.items > 1 && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      and {number(order.items - 1)} more
                    </Typography>
                  )}
                </Stack>,
                <Stack key="paid" spacing={0.25} sx={{ textAlign: 'right' }}>
                  {coinsOnly ? (
                    <>
                      <Typography variant="subtitle2">{coins(order.inCoins?.total ?? order.coinsUsed)} coins</Typography>
                      <Label color="secondary" variant="soft">
                        coins only
                      </Label>
                    </>
                  ) : moneyOnly ? (
                    <>
                      <Typography variant="subtitle2">{rupees(order.payable)}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        money only
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="subtitle2">{rupees(order.payable)}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        + {coins(order.coinsUsed)} coins
                      </Typography>
                    </>
                  )}
                </Stack>,
                <Stack key="at" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{ago(order.placedAt)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {dateTime(order.placedAt)}
                    {order.city ? ` · ${order.city}` : ''}
                  </Typography>
                </Stack>,
                <LinkButton key="open" href={paths.dashboard.order(order.id)} size="small" variant="outlined">
                  Open
                </LinkButton>,
              ],
            };
          })}
          empty={query.q || query.status || query.paidWith ? 'No order matches those filters.' : 'No order has been placed yet.'}
        />
        <OffsetPager total={orders.total} offset={orders.offset} limit={orders.limit} />
      </Panel>
    </Stack>
  );
}
