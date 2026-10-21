import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  Kv,
  LinkButton,
  Mono,
  OrderStatusChip,
  Panel,
  RowLink,
  Stat,
} from '@/src/components/ui';
import { ADMIN_TIMEZONE, adminGet } from '@/src/lib/api';
import { ago, dateTime, localInputValue, number, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { CouponDetail } from '@/src/lib/types';

import { CouponDelete, CouponForm, CouponQuickEdit } from './coupon-forms';
import { CouponStateChip, windowOf, worthOf } from './view';

/**
 * One campaign in full: what it does, who has claimed it, and the orders
 * that hold it.
 *
 * The usage table is the per-member counter the limit is actually held by —
 * `coupon_usage`, incremented under a conditional write at checkout — which
 * is the answer to "they say the code will not work for them": at the limit
 * is a different problem from expired, and the row says which.
 */
export async function CouponDetailView({ code }: { code: string }) {
  const detail = await adminGet<CouponDetail>(`/admin/shop/coupons/${encodeURIComponent(code)}`);
  const { coupon, shop, usage, orders } = detail;

  const atLimit = usage.filter(entry => entry.atLimit).length;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">
          <Mono>{coupon.code}</Mono>
        </Typography>
        <CouponStateChip coupon={coupon} />
        <Label color="default" variant="soft">
          {worthOf(coupon)}
        </Label>
        {!shop.couponsEnabled && (
          <Label color="error" variant="soft">
            coupons are off shop-wide
          </Label>
        )}
        <LinkButton href={paths.dashboard.coupons} size="small" color="inherit" variant="outlined">
          All coupons
        </LinkButton>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Claimed"
            value={number(coupon.redemptions)}
            icon="solar:hand-stars-bold-duotone"
            goodDirection="none"
            hint={coupon.maxRedemptions === null ? 'no total limit' : `${number(coupon.remaining ?? 0)} of ${number(coupon.maxRedemptions)} left`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Given away"
            value={rupees(coupon.given)}
            icon="solar:cash-out-bold-duotone"
            goodDirection="none"
            hint={`over ${number(coupon.orders)} order(s)`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Goods it moved"
            value={rupees(coupon.goods, true)}
            icon="solar:bag-4-bold-duotone"
            goodDirection="none"
            hint="subtotal of the orders holding it"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="At their limit"
            value={number(atLimit)}
            icon="solar:lock-keyhole-bold-duotone"
            goodDirection="none"
            hint={`${coupon.perUserLimit} per member`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="What it does" subtitle="As the till reads it">
            <Kv
              items={[
                { label: 'Member reads', value: coupon.title },
                { label: 'Takes off', value: worthOf(coupon) },
                {
                  label: 'Goods must reach',
                  value: coupon.minSubtotal > 0 ? rupees(coupon.minSubtotal) : 'any basket',
                  hint: 'at selling price, before the coupon',
                },
                { label: 'Open', value: windowOf(coupon) },
                {
                  label: 'Total claims',
                  value: coupon.maxRedemptions === null ? 'no limit' : `${number(coupon.redemptions)} of ${number(coupon.maxRedemptions)}`,
                },
                { label: 'Per member', value: `${coupon.perUserLimit}` },
                { label: 'Written', value: `${dateTime(coupon.createdAt)} · last changed ${ago(coupon.updatedAt)}` },
              ]}
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="In a hurry" subtitle="The two edits a campaign usually needs">
            <CouponQuickEdit coupon={coupon} />
          </Panel>
        </Grid>
      </Grid>

      <Panel title="Edit it" subtitle="Every field, in rupees" note={`Dates are read and written in ${ADMIN_TIMEZONE}.`}>
        <CouponForm
          coupon={coupon}
          startsAt={localInputValue(coupon.startsAt, ADMIN_TIMEZONE)}
          endsAt={localInputValue(coupon.endsAt, ADMIN_TIMEZONE)}
          couponsEnabled={shop.couponsEnabled}
        />
      </Panel>

      <Panel
        title={`${number(usage.length)} member${usage.length === 1 ? '' : 's'} claimed it`}
        subtitle="The counter the per-member limit is actually held by"
        dense
      >
        <DataTable
          columns={[{ label: 'Member' }, { label: 'Claims', align: 'right' }, { label: 'Last' }]}
          rows={usage.map(entry => ({
            key: entry.member.id,
            tone: entry.atLimit ? 'danger' : 'default',
            cells: [
              <RowLink
                key="member"
                href={{ pathname: paths.dashboard.users.detail(entry.member.id) }}
                secondary={entry.member.email ?? entry.member.id}
              >
                {entry.member.name || entry.member.id}
              </RowLink>,
              <Stack key="count" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{number(entry.count)}</Typography>
                {entry.atLimit && (
                  <Label color="warning" variant="soft">
                    at the limit
                  </Label>
                )}
              </Stack>,
              <Typography key="last" variant="caption" sx={{ color: 'text.secondary' }}>
                {ago(entry.lastAt)}
              </Typography>,
            ],
          }))}
          empty="Nobody has used this code yet."
        />
      </Panel>

      <Panel
        title={`${number(orders.length)} order${orders.length === 1 ? '' : 's'} hold it`}
        subtitle="Each with the discount as it was placed with — the snapshot, not today's rules"
        dense
      >
        <DataTable
          columns={[
            { label: 'Order' },
            { label: 'Member' },
            { label: 'Status' },
            { label: 'Goods', align: 'right' },
            { label: 'Took off', align: 'right' },
            { label: 'Placed' },
          ]}
          rows={orders.map(order => ({
            key: order.id,
            cells: [
              <RowLink key="order" href={{ pathname: paths.dashboard.order(order.id) }}>
                <Mono>{order.number}</Mono>
              </RowLink>,
              <RowLink
                key="member"
                href={{ pathname: paths.dashboard.users.detail(order.member.id) }}
                secondary={order.member.email ?? undefined}
              >
                {order.member.name || order.member.id}
              </RowLink>,
              <OrderStatusChip key="status" status={order.status} />,
              <Typography key="goods" variant="body2">
                {rupees(order.subtotal)}
              </Typography>,
              <Typography key="off" variant="subtitle2">
                {rupees(order.discount)}
              </Typography>,
              <Typography key="placed" variant="caption" sx={{ color: 'text.secondary' }}>
                {dateTime(order.placedAt)}
              </Typography>,
            ],
          }))}
          empty="No order has used this code."
        />
      </Panel>

      <Panel title="Delete it" subtitle="Only a campaign that never ran">
        <CouponDelete coupon={coupon} />
      </Panel>
    </Stack>
  );
}
