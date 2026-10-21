import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
import { DataTable, Evidence, Kv, LinkButton, Mono, OrderStatusChip, Panel, RowLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, coins, dateTime, humanise, number, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { OrderDetail } from '@/src/lib/types';

import { AdvanceOrderForm, OrderAddressForm, UndoOrderForms } from './order-forms';

/**
 * One order in full.
 *
 * The figures are the till's, as it was when the order was placed (RULES
 * R11): the catalogue has moved since, and re-reading today's prices would
 * show a total nobody paid. So every line here is the snapshot — the address
 * included, which is why a member who has moved still sees where it went.
 *
 * **An order bought with coins is shown in coins and nothing else.** The
 * paise on a coins-only row are the conversion the till did, not a bill
 * anybody was sent, and putting a ₹ figure on that screen would be inventing
 * one. The API decides which of the three it was (`paidWith`), so this page
 * and the member's own order screen cannot disagree about it.
 */
export async function OrderDetailView({ orderId }: { orderId: string }) {
  const order = await adminGet<OrderDetail>(`/admin/orders/${encodeURIComponent(orderId)}`);
  const { money, payment, items, address, events, paidWith, inCoins } = order;
  const addressLines = address as Record<string, string | undefined> | null;

  const coinsOnly = paidWith === 'coins';
  const moneyOnly = paidWith === 'money';

  return (
    <Stack spacing={3}>
      <LinkButton
        href={paths.dashboard.users.orders(order.member.id)}
        size="small"
        color="inherit"
        startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
        sx={{ ml: -1, alignSelf: 'flex-start' }}
      >
        {order.member.name || 'This member'}’s orders
      </LinkButton>

      <Card sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h4">{order.number}</Typography>
              <OrderStatusChip status={order.status} />
              <Label color={coinsOnly ? 'secondary' : moneyOnly ? 'info' : 'warning'} variant="soft">
                {coinsOnly ? 'paid in coins' : moneyOnly ? 'paid in money' : 'coins + money'}
              </Label>
              {payment.refundedAt && (
                <Label color="warning" variant="soft">
                  refunded {ago(payment.refundedAt)}
                </Label>
              )}
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Placed {dateTime(order.placedAt)} · {ago(order.placedAt)}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Mono>{order.id}</Mono>
            </Box>
          </Box>

          <Stack direction="row" spacing={4} sx={{ flexShrink: 0, flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                {coinsOnly ? 'Paid' : moneyOnly ? 'Paid' : 'Paid in money'}
              </Typography>
              <Typography variant="h5">
                {coinsOnly ? `${coins(inCoins?.total ?? money.coinsUsed)} coins` : rupees(money.payable)}
              </Typography>
              {!coinsOnly && money.coinsUsed > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  and {coins(money.coinsUsed)} coins ({rupees(money.coinsValue)})
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                Placed by
              </Typography>
              <RowLink href={paths.dashboard.users.detail(order.member.id)} secondary={order.member.email ?? undefined}>
                {order.member.name || 'No name yet'}
              </RowLink>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {order.member.phone ?? '—'}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel
            title="What was bought"
            subtitle={`${number(items.length)} line${items.length === 1 ? '' : 's'}`}
            note={
              coinsOnly
                ? 'A coins-only order: the coin figures are the price. The paise behind them are the till’s conversion, not a bill.'
                : 'How each line was paid for, as the till split it: coins first up to the shop’s share, the rest in money.'
            }
            dense
          >
            <DataTable
              columns={
                coinsOnly
                  ? [{ label: 'Item' }, { label: 'Qty', align: 'right' }, { label: 'Coins', align: 'right' }]
                  : moneyOnly
                    ? [{ label: 'Item' }, { label: 'Qty', align: 'right' }, { label: 'Price', align: 'right' }, { label: 'Paid', align: 'right' }]
                    : [
                        { label: 'Item' },
                        { label: 'Qty', align: 'right' },
                        { label: 'Price', align: 'right' },
                        { label: 'In coins', align: 'right' },
                        { label: 'In money', align: 'right' },
                      ]
              }
              rows={items.map((item, index) => {
                const name = (
                  <Stack key="item" spacing={0.25}>
                    <Typography variant="subtitle2">
                      {item.emoji ? `${item.emoji} ` : ''}
                      {item.title}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {item.size && (
                        <Label color="default" variant="soft">
                          size {item.size}
                        </Label>
                      )}
                      {item.color && (
                        <Label color="default" variant="soft">
                          {item.color}
                        </Label>
                      )}
                      <Mono>{item.itemId}</Mono>
                    </Stack>
                  </Stack>
                );
                const quantity = number(item.quantity);
                const price = (
                  <Stack key="price" spacing={0.25} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">{rupees(item.price)}</Typography>
                    {item.mrp && item.mrp > item.price && (
                      <Typography variant="caption" sx={{ color: 'text.disabled', textDecoration: 'line-through' }}>
                        {rupees(item.mrp)}
                      </Typography>
                    )}
                  </Stack>
                );
                const inCoinsCell = (
                  <Stack key="coins" spacing={0.25} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">{coins(item.coinsUsed)}</Typography>
                    {!coinsOnly && item.coinsValue > 0 && (
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {rupees(item.coinsValue)}
                      </Typography>
                    )}
                  </Stack>
                );
                const inMoney = (
                  <Typography key="money" variant="body2" sx={{ textAlign: 'right' }}>
                    {rupees(item.moneyPaid)}
                  </Typography>
                );
                return {
                  key: `${item.itemId}-${index}`,
                  cells: coinsOnly
                    ? [
                        name,
                        quantity,
                        <Stack key="coins" spacing={0.25} sx={{ textAlign: 'right' }}>
                          <Typography variant="subtitle2">{coins(item.coinsUsed)}</Typography>
                          {item.coinPrice > 0 && (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              list {coins(item.coinPrice)}
                            </Typography>
                          )}
                        </Stack>,
                      ]
                    : moneyOnly
                      ? [name, quantity, price, inMoney]
                      : [name, quantity, price, inCoinsCell, inMoney],
                };
              })}
              empty="This order has no lines, which should not be possible."
            />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <Panel
              title="The till"
              note={
                coinsOnly
                  ? 'Coins, as the till worked them out: each line’s price rounded up to whole coins, and delivery in coins too.'
                  : 'Paise as the order was placed, shown in rupees. Coins are coins.'
              }
            >
              {coinsOnly && inCoins ? (
                <Kv
                  items={[
                    { label: 'Goods', value: `${coins(inCoins.goods)} coins` },
                    { label: 'Discount', value: inCoins.discount > 0 ? `− ${coins(inCoins.discount)} coins` : '—', hint: order.coupon?.code ?? undefined },
                    { label: 'Delivery', value: inCoins.shipping > 0 ? `${coins(inCoins.shipping)} coins` : 'free' },
                    { label: 'Paid', value: `${coins(inCoins.total)} coins` },
                    { label: 'Money owed', value: 'none — this order has no money side' },
                  ]}
                />
              ) : (
                <Kv
                  items={[
                    { label: 'Subtotal', value: rupees(money.subtotal) },
                    { label: 'Discount', value: money.discount > 0 ? `− ${rupees(money.discount)}` : '—', hint: order.coupon?.code ?? undefined },
                    { label: 'Shipping', value: money.shipping > 0 ? rupees(money.shipping) : 'free' },
                    { label: 'Total', value: rupees(money.total) },
                    ...(moneyOnly
                      ? []
                      : [{ label: 'Paid in coins', value: `${coins(money.coinsUsed)} (${rupees(money.coinsValue)})` }]),
                    { label: 'Payable in money', value: rupees(money.payable) },
                  ]}
                />
              )}
            </Panel>

            <Panel
              title="Payment"
              note={
                coinsOnly
                  ? 'A coins order never reaches the gateway: there is nothing to collect, which is what “not required” means.'
                  : 'The gateway’s own references, for a reconciliation that disagrees.'
              }
            >
              <Kv
                items={[
                  { label: 'Status', value: payment.status ?? '—' },
                  { label: 'Method', value: payment.method ?? '—', hint: payment.provider ?? undefined },
                  ...(coinsOnly
                    ? []
                    : [
                        { label: 'Amount', value: rupees(payment.amount) },
                        { label: 'Paid', value: payment.paidAt ? dateTime(payment.paidAt) : 'not paid' },
                        { label: 'Unpaid orders lapse', value: payment.expiresAt ? dateTime(payment.expiresAt) : '—' },
                        { label: 'Refunded', value: payment.refundedAt ? dateTime(payment.refundedAt) : '—' },
                        { label: 'Gateway order', value: payment.providerOrderId ? <Mono>{payment.providerOrderId}</Mono> : '—' },
                        { label: 'Gateway payment', value: payment.providerPaymentId ? <Mono>{payment.providerPaymentId}</Mono> : '—' },
                      ]),
                  { label: 'Coins ledger row', value: order.ledger.paidWithCoins ? <Mono>{order.ledger.paidWithCoins}</Mono> : '—' },
                  { label: 'Refund ledger row', value: order.ledger.refunded ? <Mono>{order.ledger.refunded}</Mono> : '—' },
                ]}
              />
            </Panel>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Panel title="Move it along" subtitle="Forwards only" note="The member is told when it ships and when it arrives.">
            <AdvanceOrderForm
              orderId={order.id}
              userId={order.member.id}
              status={order.status}
              trackingRef={order.trackingRef}
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Panel title="Undo it" subtitle="Cancel, or refund" note="Both write the order’s own history and the audit log, and both tell the member.">
            <UndoOrderForms
              orderId={order.id}
              userId={order.member.id}
              status={order.status}
              paidWith={paidWith}
              payable={money.payable}
              coinsUsed={money.coinsUsed}
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Panel title="Where it is going" subtitle="The order’s own snapshot">
            <OrderAddressForm orderId={order.id} userId={order.member.id} status={order.status} address={addressLines} />
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Delivery" note="The address as it was when the order was placed, not as the member’s book reads now.">
            {addressLines ? (
              <Kv
                items={[
                  { label: 'Name', value: addressLines.name ?? '—' },
                  { label: 'Phone', value: addressLines.phone ?? '—' },
                  {
                    label: 'Address',
                    value: [addressLines.line1, addressLines.line2, addressLines.city, addressLines.state, addressLines.postalCode]
                      .filter(Boolean)
                      .join(', '),
                  },
                  { label: 'Tracking', value: order.trackingRef ?? 'none' },
                  {
                    label: 'Promised',
                    value: order.estimatedDelivery?.from
                      ? `${order.estimatedDelivery.from} – ${order.estimatedDelivery.to ?? ''}`
                      : '—',
                  },
                  { label: 'Notes', value: order.notes ?? '—' },
                ]}
              />
            ) : (
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                No address snapshot on this order.
              </Typography>
            )}
            {order.delivery && <Evidence data={order.delivery} label="What they asked for at the door" />}
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Its own history" subtitle="Who moved it, and when" dense>
            <DataTable
              columns={[{ label: 'When' }, { label: 'From → to' }, { label: 'By', align: 'right' }]}
              rows={events.map((event, index) => ({
                key: `${event.to}-${event.at}-${index}`,
                cells: [
                  <Stack key="at" spacing={0.25}>
                    <Typography variant="body2">{dateTime(event.at)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {ago(event.at)}
                    </Typography>
                  </Stack>,
                  <Typography key="move" variant="body2">
                    {event.from ? `${humanise(event.from)} → ` : ''}
                    {humanise(event.to)}
                  </Typography>,
                  <Label key="by" color={event.actor === 'admin' ? 'warning' : 'default'} variant="soft">
                    {event.actor}
                  </Label>,
                ],
              }))}
              empty="Nothing has moved this order since it was placed."
            />
          </Panel>
        </Grid>
      </Grid>
    </Stack>
  );
}
