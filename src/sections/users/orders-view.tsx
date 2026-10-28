import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { CursorPager, DataTable, LinkButton, Mono, OrderStatusChip, Panel, RowLink, SelectFilter, Stat } from '@/src/components/ui';
import { adminGet, memberZone } from '@/src/lib/api';
import { ago, coins, dateTime, number, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { MemberOrders } from '@/src/lib/types';

/**
 * What they have bought (RULES R11).
 *
 * Money is paise everywhere in the API and rupees everywhere on screen; the
 * coins half of an order is coins. Both halves are shown on every row,
 * because "I paid for that with coins" is the thing being checked.
 */
export async function MemberOrdersView({
  userId,
  status,
  cursor,
}: {
  userId: string;
  status: string;
  cursor: string;
}) {
  const zone = await memberZone(userId);

  const orders = await adminGet<MemberOrders>(`/admin/users/${encodeURIComponent(userId)}/orders`, {
    limit: 25,
    status: status || undefined,
    cursor: cursor || undefined,
  });
  const { totals, data } = orders;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Orders" value={number(totals.orders)} icon="solar:bag-4-bold-duotone" hint={`${number(totals.cancelled)} cancelled or refunded`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Paid in money"
            value={rupees(totals.payable, true)}
            icon="solar:wallet-bold-duotone"
            hint={totals.orders > 0 ? `${rupees(Math.round(totals.payable / totals.orders), true)} an order` : 'nothing yet'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Paid in coins" value={coins(totals.coinsUsed)} icon="solar:dollar-minimalistic-bold-duotone" goodDirection="none" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Last order"
            value={ago(data[0]?.placedAt)}
            icon="solar:clock-circle-bold-duotone"
            goodDirection="none"
            hint={data[0]?.number ?? 'none placed'}
          />
        </Grid>
      </Grid>

      <Panel
        title="Order history"
        subtitle="Newest first"
        note="The number is what a member reads out on a call; the id underneath is the key. Open one for every line, the address as it was, and its own history."
        action={
          <SelectFilter
            label="Status"
            param="status"
            value={status}
            options={[
              { value: '', label: 'Every status' },
              ...['pending_payment', 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'].map(value => ({
                value,
                label: value.replace(/_/g, ' '),
              })),
            ]}
            width={160}
          />
        }
        dense
      >
        <DataTable
          columns={[
            { label: 'Order' },
            { label: 'Status' },
            { label: 'Items' },
            { label: 'Paid', align: 'right' },
            { label: 'Coins', align: 'right' },
            { label: 'Placed', align: 'right' },
            { label: '', align: 'right', width: 110 },
          ]}
          rows={data.map(order => ({
            key: order.id,
            tone: order.status === 'cancelled' || order.status === 'refunded' ? 'danger' : 'default',
            cells: [
              <RowLink key="no" href={paths.dashboard.order(order.id)} secondary={<Mono>{order.id}</Mono>}>
                {order.number}
              </RowLink>,
              <Stack key="status" spacing={0.25}>
                <OrderStatusChip status={order.status} />
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {order.payment.status ?? 'no payment'}
                  {order.payment.method ? ` · ${order.payment.method}` : ''}
                </Typography>
              </Stack>,
              <Stack key="items" spacing={0.25} sx={{ maxWidth: 220 }}>
                <Typography variant="body2">{order.firstItem ?? '—'}</Typography>
                {order.items > 1 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    and {number(order.items - 1)} more
                  </Typography>
                )}
              </Stack>,
              // A coins order has no money side: showing it a rupee figure
              // would be inventing a bill (RULES R11).
              order.paidWith === 'coins' ? (
                <Stack key="money" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2">{coins(order.inCoins?.total ?? order.coinsUsed)} coins</Typography>
                  <Label color="secondary" variant="soft">
                    coins only
                  </Label>
                </Stack>
              ) : (
                <Stack key="money" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2">{rupees(order.payable)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    of {rupees(order.total)}
                  </Typography>
                </Stack>
              ),
              order.paidWith === 'money' ? (
                <Typography key="coins" variant="caption" sx={{ color: 'text.disabled', textAlign: 'right', display: 'block' }}>
                  —
                </Typography>
              ) : (
                <Stack key="coins" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{coins(order.coinsUsed)}</Typography>
                  {order.paidWith !== 'coins' && order.coinsValue > 0 && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      worth {rupees(order.coinsValue)}
                    </Typography>
                  )}
                </Stack>
              ),
              <Stack key="at" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{ago(order.placedAt)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {dateTime(order.placedAt, zone)}
                  {order.city ? ` · ${order.city}` : ''}
                </Typography>
              </Stack>,
              <LinkButton key="open" href={paths.dashboard.order(order.id)} size="small" variant="outlined">
                Open
              </LinkButton>,
            ],
          }))}
          empty={status ? 'No order of theirs has that status.' : 'This member has never placed an order.'}
        />
        <CursorPager next={orders.nextCursor} cursor={cursor} />
      </Panel>
    </Stack>
  );
}
