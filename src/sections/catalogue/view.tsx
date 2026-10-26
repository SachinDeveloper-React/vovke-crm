import Box from '@mui/material/Box';
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
  Panel,
  RowLink,
  SearchFilter,
  SelectFilter,
  Stat,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { coins, number, percent, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { Catalogue, Categories } from '@/src/lib/types';

import { AddCategoryButton } from './category-forms';
import { ImportProductsButton } from './import-form';
import { NewProductButton, QuickEdit } from './item-forms';

export type CatalogueQuery = {
  q: string;
  category: string;
  paymentMode: string;
  state: string;
  sort: string;
  limit: number;
  offset: number;
};

/**
 * The shelf, and the one field that decides how anything on it may be bought.
 *
 * `paymentMode` is per item and beats the shop's: a coins-only reward sits on
 * the same shelf as a money-only product, and `null` follows ⚙
 * `commerce.paymentMode`. Every row says which it is in force under, so a
 * null is never left as a mystery.
 *
 * Nothing here deletes. Retiring takes an item off the member's shelf and
 * leaves every order that holds it readable — an order carries its own
 * snapshot of what was bought.
 */
export async function CatalogueView({ query }: { query: CatalogueQuery }) {
  // The shelves come with the page because both dropdowns on the item form
  // are built from them, and so is the category filter: a shelf added on
  // Categories is offered here on the next load, with no list to keep in
  // step by hand.
  const [catalogue, categories] = await Promise.all([
    adminGet<Catalogue>('/admin/shop/items', {
      q: query.q,
      category: query.category || undefined,
      paymentMode: query.paymentMode || undefined,
      state: query.state || 'any',
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
    }),
    adminGet<Categories>('/admin/shop/categories'),
  ]);
  const { shop, data } = catalogue;
  const shelves = categories.data;
  const nameOf = (slug: string) => shelves.find(shelf => shelf.category === slug)?.name ?? slug;

  const out = data.filter(item => item.stock.out).length;
  const low = data.filter(item => item.stock.low).length;
  const coinsOnly = data.filter(item => (item.paymentMode ?? shop.paymentMode) === 'coins').length;

  return (
    <Stack spacing={3}>
      {/* On top, because listing something is what this page is opened to
          do far more often than it is opened to read a figure. */}
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
        <NewProductButton shop={shop} shelves={shelves} />
        <ImportProductsButton />
        <AddCategoryButton icons={categories.icons} />
        <LinkButton href={paths.dashboard.categories} size="small" color="inherit" variant="outlined">
          Shelves &amp; subcategories
        </LinkButton>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Items"
            value={number(catalogue.total)}
            icon="solar:box-bold-duotone"
            goodDirection="none"
            hint={`${number(data.filter(item => item.active).length)} on the shelf in this page`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Shop pays in"
            value={shop.paymentMode}
            icon="solar:wallet-money-bold-duotone"
            goodDirection="none"
            hint={`1 coin = ${rupees(shop.coinValuePaise)} · coins cover ${percent(shop.coinShareMin, 0)}–${percent(shop.coinShareMax, 0)} of a mixed order`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Coins-only on this page" value={number(coinsOnly)} icon="solar:dollar-minimalistic-bold-duotone" goodDirection="none" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Stock to watch"
            value={`${number(out)}/${number(low)}`}
            icon="solar:box-minimalistic-bold-duotone"
            goodDirection="down"
            hint="out of stock / running low, on this page"
          />
        </Grid>
      </Grid>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Title, slug or tag" />
        <SelectFilter
          label="Category"
          param="category"
          value={query.category}
          options={[
            { value: '', label: 'Every category' },
            ...shelves.map(shelf => ({ value: shelf.category, label: `${shelf.name} (${shelf.items})` })),
          ]}
          width={180}
        />
        <SelectFilter
          label="Paid with"
          param="paymentMode"
          value={query.paymentMode}
          options={[
            { value: '', label: 'Any mode' },
            { value: 'coins', label: 'Coins only' },
            { value: 'money', label: 'Money only' },
            { value: 'mixed', label: 'Coins + money' },
            { value: 'shop', label: 'Follows the shop' },
          ]}
          width={170}
        />
        <SelectFilter
          label="State"
          param="state"
          value={query.state}
          options={[
            { value: 'any', label: 'Everything' },
            { value: 'active', label: 'On the shelf' },
            { value: 'retired', label: 'Retired' },
            { value: 'out_of_stock', label: 'Out of stock' },
            { value: 'low_stock', label: 'Running low' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'sort', label: 'Shelf order' },
            { value: 'newest', label: 'Newest' },
            { value: 'price_asc', label: 'Cheapest' },
            { value: 'price_desc', label: 'Dearest' },
            { value: 'popular', label: 'Best selling' },
            { value: 'title', label: 'By title' },
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
        title={`${number(catalogue.total)} item${catalogue.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : 'retired rows included'}
        dense
      >
        <DataTable
          columns={[
            { label: 'Item' },
            { label: 'Paid with' },
            { label: 'Price', align: 'right' },
            { label: 'Stock', align: 'right' },
            { label: 'Sold', align: 'right' },
            { label: 'Change it', width: 300 },
          ]}
          rows={data.map(item => ({
            key: item.id,
            tone: item.stock.out || !item.active ? 'danger' : 'default',
            cells: [
              <Stack key="item" spacing={0.25}>
                <RowLink href={{ pathname: paths.dashboard.catalogueItem(item.id) }}>
                  {item.emoji ? `${item.emoji} ` : ''}
                  {item.title}
                </RowLink>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Label color="default" variant="soft">
                    {nameOf(item.category)}
                    {item.subcategory ? ` · ${item.subcategory}` : ''}
                  </Label>
                  {item.badge && (
                    <Label color="info" variant="soft">
                      {item.badge.replace(/_/g, ' ')}
                    </Label>
                  )}
                  {item.featured && (
                    <Label color="warning" variant="soft">
                      featured
                    </Label>
                  )}
                  {!item.active && (
                    <Label color="error" variant="soft">
                      retired
                    </Label>
                  )}
                </Stack>
                <Mono>{item.id}</Mono>
              </Stack>,
              <Stack key="mode" spacing={0.25}>
                <Label
                  color={
                    item.effectivePaymentMode === 'coins' ? 'secondary' : item.effectivePaymentMode === 'money' ? 'info' : 'warning'
                  }
                  variant="soft"
                >
                  {item.effectivePaymentMode}
                </Label>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {item.paymentMode ? 'its own' : 'the shop’s'}
                </Typography>
              </Stack>,
              <Stack key="price" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2">
                  {item.effectivePaymentMode === 'coins' ? `${coins(item.coinPrice)} coins` : rupees(item.price)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {item.effectivePaymentMode === 'coins' ? `list ${rupees(item.price)}` : `${coins(item.coinPrice)} coins`}
                  {item.coinPriceSet ? ' · set' : ''}
                </Typography>
              </Stack>,
              <Stack key="stock" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{number(item.stock.onHand)}</Typography>
                {item.stock.out ? (
                  <Label color="error" variant="soft">
                    out
                  </Label>
                ) : item.stock.low ? (
                  <Label color="warning" variant="soft">
                    low
                  </Label>
                ) : null}
              </Stack>,
              <Stack key="sold" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{number(item.sold.units)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {number(item.sold.orders)} order(s)
                </Typography>
              </Stack>,
              <QuickEdit key="edit" item={item} />,
            ],
          }))}
          empty={query.q || query.category || query.paymentMode ? 'Nothing matches those filters.' : 'The shelf is empty.'}
        />
        <OffsetPager total={catalogue.total} offset={catalogue.offset} limit={catalogue.limit} />
      </Panel>

      <Box>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          A name opens the product: every field, what it has sold, who is waiting for it, and what members said.
          Retiring takes an item off the member’s shelf and leaves every order that holds it readable, because an order
          carries its own snapshot of what was bought — deleting one outright is on the product page and is refused for
          anything an order holds. Prices are rupees here and paise on the wire; an item’s coin price is the rupee price
          divided out at the shop’s coin value unless somebody typed one on the item, and “set” on a row says which it
          is. The shop-wide mode and the coin value are ⚙ config, not fields here.
        </Typography>
      </Box>
    </Stack>
  );
}
