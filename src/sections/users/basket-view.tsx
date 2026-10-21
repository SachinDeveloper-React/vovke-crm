import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Kv, Mono, Panel, RowLink, Stat, TextLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, coins, number, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { BasketDetail } from '@/src/lib/types';

import { ClearBasket, RemoveCoupon, RemoveLine, RemoveSaved } from '../baskets/basket-forms';

/**
 * One member's basket and saved list (RULES R14).
 *
 * The page answers "my basket will not check out" and "the code will not
 * work", which are the two things support is told about a basket. Both need
 * the gap between what is stored and what the member sees:
 *
 *   - **Two kinds of stuck, and only one lasts.** A line whose item went off
 *     the shelf is dropped by their own basket the next time they open it —
 *     and this read drops it too, because it quotes the basket the way the
 *     app does. A line whose item is merely *out of stock* is kept and
 *     refused at checkout with nothing to tell them why. That is `blocked`,
 *     and it is the one worth acting on.
 *   - **The quote is theirs, not ours.** It is the same call the app makes,
 *     so the coupon as applied and its problem text are exactly the words on
 *     their screen.
 *
 * Every figure is at today's prices: a basket holds references, not
 * snapshots.
 */
export async function MemberBasketView({ userId }: { userId: string }) {
  const detail = await adminGet<BasketDetail>(`/admin/users/${encodeURIComponent(userId)}/basket`);
  const { basket, quote, wishlist, shop } = detail;

  const coinsOnly = shop.paymentMode === 'coins';
  const buyableSaves = wishlist.filter(saved => saved.buyable).length;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="In their basket"
            value={number(basket.units)}
            icon="solar:cart-large-minimalistic-bold-duotone"
            goodDirection="none"
            hint={`${number(basket.lines.length)} line(s) · last touched ${ago(basket.updatedAt)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Worth"
            value={rupees(basket.value)}
            icon="solar:wallet-money-bold-duotone"
            goodDirection="none"
            hint="at today's prices — a basket holds references, not snapshots"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Lines that cannot check out"
            value={number(basket.blocked)}
            icon="solar:lock-keyhole-minimalistic-bold-duotone"
            goodDirection="down"
            hint={
              basket.offShelf > 0
                ? `and ${number(basket.offShelf)} off the shelf, dropped just now`
                : 'out of stock, or short of the quantity asked for'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Saved for later"
            value={number(wishlist.length)}
            icon="solar:heart-bold-duotone"
            goodDirection="none"
            hint={`${number(buyableSaves)} in stock right now`}
          />
        </Grid>
      </Grid>

      {basket.offShelf > 0 && (
        <Panel title="What they had, and have just lost" subtitle="Lines pointing at an item off the shelf">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {number(basket.offShelf)} line(s) point at an item that is retired or has been deleted. Their basket is
            built from items still on the shelf, so it drops such a line — and writes the drop back — the next time
            they open it; this read has just done the same. Nothing to fix here, then, but worth knowing what they
            meant to buy before telling them their basket is empty.
          </Typography>
        </Panel>
      )}

      {basket.blocked > 0 && (
        <Panel title="Why it will not check out" subtitle="Lines that are still there and still refused">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {number(basket.blocked)} line(s) are out of stock, or short of the quantity they asked for. The basket
            keeps them and the checkout refuses them, and nothing on their screen says which line is the problem —
            restocking the item or taking the line out are the two ways out.
          </Typography>
        </Panel>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel
            title="The till, as they see it"
            subtitle="The same call their app makes"
            note="Delivery is decided on the goods after the coupon; the coins figures are what the shop's own shares allow (RULES R11–R13)."
          >
            <Kv
              columns={2}
              items={[
                { label: 'Goods', value: rupees(quote.subtotal) },
                { label: 'Off the list price', value: rupees(quote.mrpTotal - quote.subtotal) },
                {
                  label: 'Coupon',
                  value: quote.coupon
                    ? `${quote.coupon.code} — ${quote.coupon.problem ? quote.coupon.problem : `${rupees(quote.coupon.discount)} off`}`
                    : 'none',
                },
                { label: 'Delivery', value: quote.shipping === 0 ? 'free' : rupees(quote.shipping) },
                { label: 'Total', value: rupees(quote.total) },
                {
                  label: 'Coins it would take',
                  value: `${coins(quote.coinsApplied)} of ${coins(quote.coinsMax)} allowed`,
                  hint: quote.coinsShort > 0 ? `${coins(quote.coinsShort)} short of the floor — they cannot place it` : undefined,
                },
                { label: 'Left to pay', value: coinsOnly && quote.inCoins ? `${coins(quote.inCoins.total)} coins` : rupees(quote.payable) },
              ]}
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title="Act on it" subtitle="Both writes go through the member's own cart path">
            <Stack spacing={2}>
              {basket.couponCode ? (
                <Stack spacing={0.75}>
                  <Typography variant="body2">
                    Holding{' '}
                    <TextLink href={{ pathname: paths.dashboard.coupon(basket.couponCode) }}>
                      <Mono>{basket.couponCode}</Mono>
                    </TextLink>
                    {quote.coupon?.problem ? ` — ${quote.coupon.problem}` : ''}
                  </Typography>
                  <RemoveCoupon userId={userId} code={basket.couponCode} />
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    A basket keeps its code while it does not apply, so that it comes back when the basket qualifies.
                    Right for somebody still shopping; wrong for somebody stuck behind a campaign that has ended.
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No coupon on this basket.
                </Typography>
              )}
              <ClearBasket userId={userId} lines={basket.lines.length} />
            </Stack>
          </Panel>
        </Grid>
      </Grid>

      <Panel
        title={`${number(basket.lines.length)} line${basket.lines.length === 1 ? '' : 's'}`}
        subtitle="As stored, before this read tidied anything off the shelf"
        dense
      >
        <DataTable
          columns={[
            { label: 'Item' },
            { label: 'Chose' },
            { label: 'Qty', align: 'right' },
            { label: 'Now', align: 'right' },
            { label: 'State' },
            { label: 'Take it out', width: 240 },
          ]}
          rows={basket.lines.map(line => ({
            key: `${line.itemId}:${line.size ?? ''}:${line.color ?? ''}`,
            tone: line.problem ? 'danger' : 'default',
            cells: [
              <Stack key="item" spacing={0.25}>
                <RowLink
                  href={{ pathname: paths.dashboard.catalogueItem(line.itemId) }}
                  secondary={`${line.category ?? 'uncategorised'} · added ${ago(line.addedAt)}`}
                >
                  {line.emoji ? `${line.emoji} ` : ''}
                  {line.title}
                </RowLink>
                <Mono>{line.itemId}</Mono>
              </Stack>,
              <Typography key="chose" variant="caption" sx={{ color: 'text.secondary' }}>
                {[line.size, line.color].filter(Boolean).join(' · ') || '—'}
              </Typography>,
              <Typography key="qty" variant="body2" sx={{ textAlign: 'right' }}>
                {number(line.quantity)}
              </Typography>,
              <Stack key="now" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2">
                  {line.effectivePaymentMode === 'coins' ? `${coins(line.coinPrice)} coins` : rupees(line.lineTotal)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {rupees(line.price)} each · {line.effectivePaymentMode}
                </Typography>
              </Stack>,
              <Stack key="state" spacing={0.25}>
                {line.problem ? (
                  <Label color="error" variant="soft">
                    {line.problem}
                  </Label>
                ) : (
                  <Label color="success" variant="soft">
                    {number(line.onHand)} in stock
                  </Label>
                )}
                {!line.visibleToMember && (
                  <Label color="warning" variant="soft">
                    dropped from their basket
                  </Label>
                )}
              </Stack>,
              <RemoveLine key="remove" userId={userId} itemId={line.itemId} size={line.size} color={line.color} />,
            ],
          }))}
          empty="Their basket is empty."
        />
      </Panel>

      <Panel
        title={`${number(wishlist.length)} saved for later`}
        subtitle="What they want and have not bought — the restock argument, one member at a time"
        dense
      >
        <DataTable
          columns={[
            { label: 'Item' },
            { label: 'Price', align: 'right' },
            { label: 'On the shelf', align: 'right' },
            { label: 'Saved' },
            { label: 'Unsave it', width: 240 },
          ]}
          rows={wishlist.map(saved => ({
            key: saved.itemId,
            tone: saved.active && saved.onHand > 0 ? 'default' : 'danger',
            cells: [
              <Stack key="item" spacing={0.25}>
                <RowLink href={{ pathname: paths.dashboard.catalogueItem(saved.itemId) }}>
                  {saved.emoji ? `${saved.emoji} ` : ''}
                  {saved.title}
                </RowLink>
                {!saved.active && (
                  <Label color="error" variant="soft">
                    retired — their saved list does not show it
                  </Label>
                )}
              </Stack>,
              <Typography key="price" variant="body2" sx={{ textAlign: 'right' }}>
                {rupees(saved.price)}
              </Typography>,
              <Stack key="stock" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{number(saved.onHand)}</Typography>
                {saved.onHand === 0 && (
                  <Label color="warning" variant="soft">
                    out
                  </Label>
                )}
              </Stack>,
              <Typography key="saved" variant="caption" sx={{ color: 'text.secondary' }}>
                {ago(saved.addedAt)}
              </Typography>,
              <RemoveSaved key="remove" userId={userId} itemId={saved.itemId} />,
            ],
          }))}
          empty="They have not saved anything."
        />
      </Panel>
    </Stack>
  );
}
