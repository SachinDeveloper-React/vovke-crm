import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  Evidence,
  Kv,
  LinkButton,
  Mono,
  OrderStatusChip,
  Panel,
  RowLink,
  Stat,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, coins, dateTime, decimal, number, percent, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { Categories, ItemInsight } from '@/src/lib/types';

import { QuickEdit } from './item-forms';
import { ProductDelete, ProductForm } from './product-forms';
import { ReviewDelete } from '../reviews/review-forms';

/**
 * One product, in full.
 *
 * The row itself answers what it is and what it costs. This page answers the
 * four questions after that, each of which lives in a different collection:
 * has it sold, who is waiting for it, what are people saying, and who
 * changed it last.
 *
 * `wanted` is the one worth acting on: saves plus basket units against
 * stock. Sales figures can only ever show what was in stock, so an item
 * fifty people saved and nobody could buy looks like a failure in the sales
 * column and a restock here.
 */
export async function ProductDetailView({ itemId }: { itemId: string }) {
  const [insight, categories] = await Promise.all([
    adminGet<ItemInsight>(`/admin/shop/items/${encodeURIComponent(itemId)}/insight`),
    adminGet<Categories>('/admin/shop/categories'),
  ]);
  const { item, shop, sales, wanted, orders, reviews, trail } = insight;

  const inCoins = item.effectivePaymentMode === 'coins';
  const margin = item.mrp && item.mrp > item.price ? (item.mrp - item.price) / item.mrp : null;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">
          {item.emoji ? `${item.emoji} ` : ''}
          {item.title}
        </Typography>
        <Mono>{item.id}</Mono>
        <Label color="default" variant="soft">
          {item.category}
          {item.subcategory ? ` · ${item.subcategory}` : ''}
        </Label>
        <Label
          color={item.effectivePaymentMode === 'coins' ? 'secondary' : item.effectivePaymentMode === 'money' ? 'info' : 'warning'}
          variant="soft"
        >
          {item.effectivePaymentMode}
          {item.paymentMode ? '' : ' (the shop’s)'}
        </Label>
        {!item.active && (
          <Label color="error" variant="soft">
            retired
          </Label>
        )}
        {item.stock.out && (
          <Label color="error" variant="soft">
            out of stock
          </Label>
        )}
        <LinkButton href={paths.dashboard.catalogue} size="small" color="inherit" variant="outlined">
          All items
        </LinkButton>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Price"
            value={inCoins ? `${coins(item.coinPrice)} coins` : rupees(item.price)}
            icon="solar:tag-price-bold-duotone"
            goodDirection="none"
            hint={
              inCoins
                ? `list ${rupees(item.price)}`
                : `${coins(item.coinPrice)} coins${margin ? ` · ${percent(margin, 0)} under list` : ''}`
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Sold"
            value={number(sales.units)}
            icon="solar:cart-check-bold-duotone"
            goodDirection="up"
            hint={`${number(sales.orders)} order(s) · ${rupees(sales.goods, true)} of goods`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="On the shelf"
            value={number(item.stock.onHand)}
            icon="solar:box-bold-duotone"
            goodDirection="up"
            hint={`low below ${number(item.stock.lowStockAt)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Wanted, not bought"
            value={number(wanted.wishlists + wanted.baskets)}
            icon="solar:heart-bold-duotone"
            goodDirection="none"
            hint={
              wanted.short > 0
                ? `${number(wanted.short)} more than there are units to sell`
                : `${number(wanted.wishlists)} saved · ${number(wanted.baskets)} in a basket`
            }
          />
        </Grid>
      </Grid>

      {wanted.short > 0 && (
        <Panel title="Restock" subtitle="Wanted by more people than there is stock">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {number(wanted.wishlists)} member(s) saved it and {number(wanted.baskets)} have {number(wanted.basketUnits)}{' '}
            unit(s) of it in a basket, against {number(item.stock.onHand)} on the shelf — {number(wanted.short)} short.
            Every one of those baskets fails at checkout until the stock arrives, and nothing tells the member why.
          </Typography>
        </Panel>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="As the till reads it" subtitle="Prices in paise on the wire, rupees here">
            <Kv
              items={[
                { label: 'Paid with', value: `${item.effectivePaymentMode}${item.paymentMode ? ' (its own)' : ' (the shop’s)'}` },
                { label: 'Price', value: `${rupees(item.price)} · ${coins(item.coinPrice)} coins`, hint: 'coins rounded up, as the till does' },
                { label: 'Struck through', value: item.mrp ? rupees(item.mrp) : 'nothing' },
                { label: 'Sizes', value: item.sizes.length > 0 ? item.sizes.join(', ') : 'one size' },
                { label: 'Colours', value: item.colors.length > 0 ? item.colors.map(colour => colour.name).join(', ') : 'none' },
                { label: 'Photos', value: `${number(item.images.length)}` },
                { label: 'Rating', value: `${decimal(item.rating.average, 1)} from ${number(item.rating.count)}` },
                { label: 'Listed', value: `${dateTime(item.listedAt)} · last changed ${ago(item.updatedAt)}` },
              ]}
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel
            title="In a hurry"
            subtitle="Price, mode, stock, and the shelf"
            note="The same three edits as on the list, so a page opened from a stock alert needs nothing else."
          >
            <QuickEdit item={item} />
          </Panel>
        </Grid>
      </Grid>

      <Panel
        title="Every field"
        subtitle="A patch: the slug is fixed, because baskets and orders key on it"
        note="The record lists are one per line with | between the parts. Nothing here touches an order: an order carries its own snapshot of what was bought (RULES R11)."
      >
        <ProductForm item={item} shop={shop} shelves={categories.data} />
      </Panel>

      <Panel
        title={`${number(orders.length)} recent order${orders.length === 1 ? '' : 's'}`}
        subtitle="What each line was charged, as the till split it"
        dense
      >
        <DataTable
          columns={[
            { label: 'Order' },
            { label: 'Member' },
            { label: 'Status' },
            { label: 'Units', align: 'right' },
            { label: 'Charged', align: 'right' },
            { label: 'Chose' },
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
              <Typography key="units" variant="body2">
                {number(order.quantity)}
              </Typography>,
              <Stack key="charged" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2">{rupees(order.price)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {order.coinsUsed > 0 ? `${coins(order.coinsUsed)} coins` : ''}
                  {order.coinsUsed > 0 && order.moneyPaid > 0 ? ' + ' : ''}
                  {order.moneyPaid > 0 ? rupees(order.moneyPaid) : ''}
                  {order.coinsUsed === 0 && order.moneyPaid === 0 ? '—' : ''}
                </Typography>
              </Stack>,
              <Typography key="chose" variant="caption" sx={{ color: 'text.secondary' }}>
                {[order.size, order.color].filter(Boolean).join(' · ') || '—'}
              </Typography>,
              <Typography key="placed" variant="caption" sx={{ color: 'text.secondary' }}>
                {dateTime(order.placedAt)}
              </Typography>,
            ],
          }))}
          empty="Nobody has bought this yet."
        />
      </Panel>

      <Panel
        title={`${number(reviews.count)} review${reviews.count === 1 ? '' : 's'}`}
        subtitle={`${decimal(reviews.average, 1)} out of 5 — the figure every list and sort reads`}
        note="Taking one down recounts the item at once."
        dense
      >
        <DataTable
          columns={[
            { label: 'Stars', width: 90 },
            { label: 'What they wrote' },
            { label: 'Member' },
            { label: 'Take it down', width: 260 },
          ]}
          rows={reviews.data.map(review => ({
            key: review.id,
            tone: review.rating <= 2 ? 'danger' : 'default',
            cells: [
              <Stack key="stars" spacing={0.25}>
                <Typography
                  variant="body2"
                  sx={{ color: review.rating <= 2 ? 'error.main' : review.rating === 3 ? 'warning.main' : 'success.main' }}
                >
                  {'★'.repeat(review.rating)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {ago(review.createdAt)}
                </Typography>
              </Stack>,
              <Stack key="body" spacing={0.25} sx={{ maxWidth: 420 }}>
                {review.title && <Typography variant="subtitle2">{review.title}</Typography>}
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {review.body}
                </Typography>
                <Label color={review.verified ? 'success' : 'default'} variant="soft">
                  {review.verified ? 'verified buyer' : 'not verified'}
                </Label>
              </Stack>,
              <RowLink
                key="member"
                href={{ pathname: paths.dashboard.users.detail(review.member.id) }}
                secondary={review.member.email ?? undefined}
              >
                {review.member.name || review.authorName}
              </RowLink>,
              <ReviewDelete key="delete" id={review.id} />,
            ],
          }))}
          empty="No reviews yet."
        />
      </Panel>

      <Panel title="Who changed it" subtitle="Every write to this item, newest first" dense>
        <DataTable
          columns={[{ label: 'What' }, { label: 'Who' }, { label: 'When' }, { label: 'Before → after' }]}
          rows={trail.map(entry => ({
            key: entry.id,
            cells: [
              <Typography key="what" variant="subtitle2">
                {entry.action.replace('shop.', '').replace(/_/g, ' ')}
              </Typography>,
              <Mono key="who">{entry.actorId ?? 'system'}</Mono>,
              <Typography key="when" variant="caption" sx={{ color: 'text.secondary' }}>
                {dateTime(entry.at)}
              </Typography>,
              <Evidence key="diff" data={{ before: entry.before, after: entry.after }} />,
            ],
          }))}
          empty="Nothing has been changed through the panel."
        />
      </Panel>

      <Panel title="Delete it" subtitle="Only the mistake case — a slug typed wrong, a draft listed by accident">
        <ProductDelete item={item} orders={sales.orders > 0 ? sales.orders : orders.length} />
      </Panel>
    </Stack>
  );
}
