import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  FilterBar,
  Mono,
  OffsetPager,
  Panel,
  RowLink,
  SearchFilter,
  SelectFilter,
  Stat,
} from '@/src/components/ui';
import { ADMIN_TIMEZONE, adminGet } from '@/src/lib/api';
import { dateTime, number, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { Coupon, CouponState, Coupons } from '@/src/lib/types';

import { CouponForm, CouponQuickEdit } from './coupon-forms';

export type CouponsQuery = {
  q: string;
  state: string;
  kind: string;
  sort: string;
  limit: number;
  offset: number;
};

const TONE: Record<CouponState, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  live: 'success',
  scheduled: 'info',
  expired: 'default',
  exhausted: 'warning',
  inactive: 'error',
};

/** What a coupon takes off, in the words it was written in. */
export function worthOf(coupon: Coupon): string {
  if (coupon.kind === 'percent') {
    return `${coupon.value}% off${coupon.maxDiscount ? `, max ${rupees(coupon.maxDiscount)}` : ''}`;
  }
  return `${rupees(coupon.value)} off`;
}

/** The window a coupon is open in, or the half of it that is set. */
export function windowOf(coupon: Coupon): string {
  if (!coupon.startsAt && !coupon.endsAt) return 'always open';
  if (!coupon.endsAt) return `from ${dateTime(coupon.startsAt)}`;
  if (!coupon.startsAt) return `until ${dateTime(coupon.endsAt)}`;
  return `${dateTime(coupon.startsAt)} → ${dateTime(coupon.endsAt)}`;
}

export function CouponStateChip({ coupon }: { coupon: Coupon }) {
  return (
    <Label color={TONE[coupon.state]} variant="soft">
      {coupon.state}
    </Label>
  );
}

/**
 * Campaigns, and what each one has actually cost (RULES R16).
 *
 * `given` is the figure to read: summed from the orders' own snapshots
 * rather than recomputed, so a coupon whose rules changed last week still
 * shows what it really gave away. `state` is the till's own verdict — the
 * five ways a code can fail to apply, in the order `checkCoupon` tests
 * them, so "inactive" means it is switched off rather than out of date.
 */
export async function CouponsView({ query }: { query: CouponsQuery }) {
  const coupons = await adminGet<Coupons>('/admin/shop/coupons', {
    q: query.q,
    state: query.state || 'any',
    kind: query.kind || undefined,
    sort: query.sort,
    limit: query.limit,
    offset: query.offset,
  });
  const { shop, data, totals } = coupons;

  const live = data.filter(coupon => coupon.state === 'live').length;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Coupons"
            value={number(totals.coupons)}
            icon="solar:ticket-sale-bold-duotone"
            goodDirection="none"
            hint={`${number(live)} live on this page`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Claims"
            value={number(totals.redemptions)}
            icon="solar:hand-stars-bold-duotone"
            goodDirection="none"
            hint="orders that held a code, across every coupon"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Given away"
            value={rupees(totals.given, true)}
            icon="solar:cash-out-bold-duotone"
            goodDirection="none"
            hint="from the orders’ own snapshots, on this page"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Shop switch"
            value={shop.couponsEnabled ? 'on' : 'off'}
            icon="solar:settings-bold-duotone"
            goodDirection="none"
            hint={shop.couponsEnabled ? '⚙ commerce.couponsEnabled' : 'no code applies to anybody'}
          />
        </Grid>
      </Grid>

      <Panel
        title="Write a campaign"
        subtitle="Or rewrite one by its code"
        note="Amounts are in rupees here and paise on the wire. A percent coupon is rounded down and capped; no coupon ever takes more than the goods."
      >
        <CouponForm couponsEnabled={shop.couponsEnabled} />
      </Panel>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Code or title" />
        <SelectFilter
          label="State"
          param="state"
          value={query.state}
          options={[
            { value: 'any', label: 'Every state' },
            { value: 'live', label: 'Live' },
            { value: 'scheduled', label: 'Not open yet' },
            { value: 'expired', label: 'Closed' },
            { value: 'exhausted', label: 'Fully claimed' },
            { value: 'inactive', label: 'Switched off' },
          ]}
          width={170}
        />
        <SelectFilter
          label="Takes off"
          param="kind"
          value={query.kind}
          options={[
            { value: '', label: 'Either kind' },
            { value: 'percent', label: 'A share' },
            { value: 'flat', label: 'A fixed amount' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'newest', label: 'Newest' },
            { value: 'code', label: 'By code' },
            { value: 'redemptions', label: 'Most claimed' },
            { value: 'value', label: 'Biggest' },
            { value: 'ending', label: 'Closing soonest' },
          ]}
          width={170}
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
        title={`${number(coupons.total)} coupon${coupons.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : 'every state, newest first'}
        dense
      >
        <DataTable
          columns={[
            { label: 'Code' },
            { label: 'Takes off' },
            { label: 'Claims', align: 'right' },
            { label: 'Given', align: 'right' },
            { label: 'Open' },
            { label: 'Change it', width: 260 },
          ]}
          rows={data.map(coupon => ({
            key: coupon.code,
            tone: coupon.state === 'inactive' || coupon.state === 'exhausted' ? 'danger' : 'default',
            cells: [
              <Stack key="code" spacing={0.25}>
                <RowLink href={{ pathname: paths.dashboard.coupon(coupon.code) }} secondary={coupon.title}>
                  <Mono>{coupon.code}</Mono>
                </RowLink>
                <CouponStateChip coupon={coupon} />
              </Stack>,
              <Stack key="worth" spacing={0.25}>
                <Typography variant="subtitle2">{worthOf(coupon)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {coupon.minSubtotal > 0 ? `goods over ${rupees(coupon.minSubtotal)}` : 'any basket'}
                </Typography>
              </Stack>,
              <Stack key="claims" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{number(coupon.redemptions)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {coupon.maxRedemptions === null
                    ? 'no limit'
                    : `${number(coupon.remaining ?? 0)} left`}{' '}
                  · {coupon.perUserLimit} each
                </Typography>
              </Stack>,
              <Stack key="given" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{rupees(coupon.given)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  over {number(coupon.orders)} order(s)
                  {coupon.cancelledOrders > 0 ? ` · ${number(coupon.cancelledOrders)} undone` : ''}
                </Typography>
              </Stack>,
              <Typography key="window" variant="caption" sx={{ color: 'text.secondary' }}>
                {windowOf(coupon)}
              </Typography>,
              <CouponQuickEdit key="edit" coupon={coupon} />,
            ],
          }))}
          empty={query.q || query.state !== 'any' ? 'Nothing matches those filters.' : 'No coupons yet.'}
        />
        <OffsetPager total={coupons.total} offset={coupons.offset} limit={coupons.limit} />
      </Panel>

      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        `redemptions` is the till’s own counter: checkout increments it under a conditional write and a cancel gives it
        back, which is what holds the total ceiling when two orders race. Nothing in the panel sets it. Dates are read
        and written in {ADMIN_TIMEZONE}.
      </Typography>
    </Stack>
  );
}
