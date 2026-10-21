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
  TextLink,
} from '@/src/components/ui';
import { adminGet, adminTry } from '@/src/lib/api';
import { ago, number, percent, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { Baskets, Demand } from '@/src/lib/types';

export type BasketsQuery = {
  q: string;
  state: string;
  staleDays: number;
  sort: string;
  limit: number;
  offset: number;
};

/**
 * Baskets nobody checked out, and what people want that is not in stock.
 *
 * Two things to say about the figures, because both are easy to read wrongly:
 *
 *   - **The value is at today's prices.** A basket holds references, not
 *     snapshots — a price that changes while something sits in one is the
 *     new price at checkout. So this is what the basket would cost now,
 *     not what it looked like when it was filled.
 *   - **`blocked` is the column to act on.** Those are lines short of
 *     stock: their basket keeps them, the checkout refuses them, and
 *     nothing on their screen says which line is the problem. `offShelf`
 *     is counted apart because it does not last — a line whose item went
 *     off the shelf is dropped by their own basket the next time they open
 *     it.
 *
 * `orderedSince` keeps the chasing honest: a basket whose owner went on to
 * buy something else is a shortlist, not an abandonment.
 */
export async function BasketsView({ query }: { query: BasketsQuery }) {
  const [baskets, demand] = await Promise.all([
    adminGet<Baskets>('/admin/shop/baskets', {
      q: query.q,
      state: query.state || 'any',
      staleDays: query.staleDays,
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
    }),
    adminTry<Demand>('/admin/shop/demand', { of: 'both', state: 'any', limit: 12, offset: 0 }),
  ]);
  const { totals, data, shop } = baskets;

  const stale = data.filter(row => row.stale).length;
  const withCoupon = data.filter(row => row.couponCode).length;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Baskets with something in"
            value={number(totals.baskets)}
            icon="solar:cart-large-minimalistic-bold-duotone"
            goodDirection="none"
            hint={`${number(stale)} untouched for ${number(totals.staleDays)}+ days, on this page`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Sitting in them"
            value={rupees(totals.value, true)}
            icon="solar:wallet-money-bold-duotone"
            goodDirection="none"
            hint={`${number(totals.units)} units, at today’s prices`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Baskets that cannot check out"
            value={number(totals.blocked)}
            icon="solar:lock-keyhole-minimalistic-bold-duotone"
            goodDirection="down"
            hint={
              totals.baskets > 0
                ? `${percent(totals.blocked / totals.baskets, 0)} of them, short of stock${
                    totals.offShelf > 0 ? ` · ${number(totals.offShelf)} holding something off the shelf` : ''
                  }`
                : 'nothing to fix'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Holding a code"
            value={number(withCoupon)}
            icon="solar:ticket-sale-bold-duotone"
            goodDirection="none"
            hint={shop.couponsEnabled ? 'on this page' : 'coupons are off shop-wide'}
          />
        </Grid>
      </Grid>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Member id, email, phone or name" />
        <SelectFilter
          label="Show"
          param="state"
          value={query.state}
          options={[
            { value: 'any', label: 'Every basket' },
            { value: 'blocked', label: 'Cannot check out' },
            { value: 'off_shelf', label: 'Holding something gone' },
            { value: 'with_coupon', label: 'Holding a code' },
            { value: 'stale', label: 'Untouched' },
            { value: 'fresh', label: 'Touched recently' },
          ]}
          width={190}
        />
        <SelectFilter
          label="Untouched for"
          param="staleDays"
          value={String(query.staleDays)}
          options={[3, 7, 14, 30, 90].map(option => ({ value: String(option), label: `${option} days` }))}
          width={150}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'updated', label: 'Last touched' },
            { value: 'value', label: 'Biggest' },
            { value: 'units', label: 'Most units' },
            { value: 'oldest', label: 'Oldest' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Rows"
          param="limit"
          value={String(query.limit)}
          options={[25, 50, 100].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={120}
        />
      </FilterBar>

      <Panel
        title={`${number(baskets.total)} basket${baskets.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : 'with at least one line in them'}
        dense
      >
        <DataTable
          columns={[
            { label: 'Member' },
            { label: 'In it' },
            { label: 'Worth', align: 'right' },
            { label: 'Code' },
            { label: 'Last touched' },
            { label: '' },
          ]}
          rows={data.map(row => ({
            key: row.member.id,
            tone: row.blocked > 0 ? 'danger' : 'default',
            cells: [
              <Stack key="member" spacing={0.25}>
                <RowLink
                  href={{ pathname: paths.dashboard.users.basket(row.member.id) }}
                  secondary={row.member.email ?? row.member.phone ?? row.member.id}
                >
                  {row.member.name || row.member.id}
                </RowLink>
                {row.orderedSince && (
                  <Label color="success" variant="soft">
                    has ordered since
                  </Label>
                )}
              </Stack>,
              <Stack key="in" spacing={0.25}>
                <Typography variant="body2">
                  {number(row.lines)} line(s) · {number(row.units)} unit(s)
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {row.titles.join(', ')}
                  {row.lines > row.titles.length ? ` +${number(row.lines - row.titles.length)} more` : ''}
                </Typography>
                {row.blocked > 0 && (
                  <Label color="error" variant="soft">
                    {number(row.blocked)} line(s) short of stock
                  </Label>
                )}
                {row.offShelf > 0 && (
                  <Label color="warning" variant="soft">
                    {number(row.offShelf)} off the shelf
                  </Label>
                )}
              </Stack>,
              <Typography key="worth" variant="subtitle2" sx={{ textAlign: 'right' }}>
                {rupees(row.value)}
              </Typography>,
              row.couponCode ? (
                <TextLink key="code" href={{ pathname: paths.dashboard.coupon(row.couponCode) }}>
                  <Mono>{row.couponCode}</Mono>
                </TextLink>
              ) : (
                <Typography key="code" variant="caption" sx={{ color: 'text.disabled' }}>
                  —
                </Typography>
              ),
              <Stack key="touched" spacing={0.25}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {ago(row.updatedAt)}
                </Typography>
                {row.stale && (
                  <Label color="warning" variant="soft">
                    untouched
                  </Label>
                )}
              </Stack>,
              <TextLink key="open" href={{ pathname: paths.dashboard.users.basket(row.member.id) }}>
                Open it
              </TextLink>,
            ],
          }))}
          empty={query.q || query.state !== 'any' ? 'Nothing matches those filters.' : 'Nobody has anything in a basket.'}
        />
        <OffsetPager total={baskets.total} offset={baskets.offset} limit={baskets.limit} />
      </Panel>

      {'data' in demand && (
        <Panel
          title="Wanted, against the shelf"
          subtitle="Saves and basket units beside stock — sorted by the wanting"
          note="The one report sales figures cannot give: they can only ever show what was in stock. `short` is how many more people want it than there are units to sell them."
          dense
        >
          <DataTable
            columns={[
              { label: 'Item' },
              { label: 'Saved', align: 'right' },
              { label: 'In baskets', align: 'right' },
              { label: 'On the shelf', align: 'right' },
              { label: 'Short', align: 'right' },
            ]}
            rows={demand.data.data.map(row => ({
              key: row.itemId,
              tone: row.out ? 'danger' : 'default',
              cells: [
                <Stack key="item" spacing={0.25}>
                  <RowLink
                    href={{ pathname: paths.dashboard.catalogueItem(row.itemId) }}
                    secondary={`${row.category ?? 'uncategorised'} · ${rupees(row.price)}`}
                  >
                    {row.emoji ? `${row.emoji} ` : ''}
                    {row.title}
                  </RowLink>
                  {!row.active && (
                    <Label color="error" variant="soft">
                      retired
                    </Label>
                  )}
                </Stack>,
                <Typography key="saved" variant="body2" sx={{ textAlign: 'right' }}>
                  {number(row.saved)}
                </Typography>,
                <Stack key="baskets" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{number(row.inBaskets)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {number(row.units)} unit(s)
                  </Typography>
                </Stack>,
                <Stack key="stock" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{number(row.onHand)}</Typography>
                  {row.out ? (
                    <Label color="error" variant="soft">
                      out
                    </Label>
                  ) : row.low ? (
                    <Label color="warning" variant="soft">
                      low
                    </Label>
                  ) : null}
                </Stack>,
                <Typography
                  key="short"
                  variant="subtitle2"
                  sx={{ textAlign: 'right', color: row.short > 0 ? 'error.main' : 'text.disabled' }}
                >
                  {row.short > 0 ? number(row.short) : '—'}
                </Typography>,
              ],
            }))}
            empty="Nothing is saved or in a basket."
          />
        </Panel>
      )}
    </Stack>
  );
}
