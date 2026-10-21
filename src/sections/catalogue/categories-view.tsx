import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Kv, Mono, Panel, Stat, TextLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { decimal, number, percent, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { Categories, ShelfMeasure } from '@/src/lib/types';

import {
  AddCategoryButton,
  CategoryRowActions,
  MoveItemsForm,
  SubcategoryForm,
  SubcategoryRowActions,
} from './category-forms';

/** The two columns every shelf row carries, whether it is a category or a subcategory. */
function stockCell(shelf: ShelfMeasure) {
  return (
    <Stack spacing={0.25} sx={{ textAlign: 'right' }}>
      <Typography variant="body2">{number(shelf.onHandUnits)}</Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {rupees(shelf.stockValue, true)}
        {shelf.outOfStock > 0 ? ` · ${number(shelf.outOfStock)} out` : ''}
        {shelf.lowStock > 0 ? ` · ${number(shelf.lowStock)} low` : ''}
      </Typography>
    </Stack>
  );
}

function soldCell(shelf: ShelfMeasure) {
  return (
    <Stack spacing={0.25} sx={{ textAlign: 'right' }}>
      <Typography variant="body2">{number(shelf.unitsSold)}</Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {rupees(shelf.goodsSold, true)}
        {shelf.coinsUsed > 0 ? ` · ${number(shelf.coinsUsed)} coins` : ''}
      </Typography>
    </Stack>
  );
}

/**
 * The shelves, and everything that can be done to them.
 *
 * Both halves of "category" are editable here now, and they are still not
 * the same kind of thing — which is what the two kinds of write are careful
 * about:
 *
 *   - **A shelf is a row**, keyed by the slug every item carries. The name
 *     and the icon are what a member sees and are changed freely; the slug
 *     is typed once. Deleting one means saying where its items go.
 *   - **A subcategory is a name on the item.** The shelf lists them so the
 *     item form can offer a dropdown — which is what stops "T-Shirts"
 *     sitting beside "T-shirts" — but the item carries the string, so a
 *     rename is a write across every item that holds it.
 *
 * `wanted` is the column with no equivalent in a sales report: saves plus
 * basket units. Sales can only ever show what was in stock.
 */
export async function CategoriesView() {
  const categories = await adminGet<Categories>('/admin/shop/categories');
  const { data, totals, icons } = categories;

  const widest = data.reduce((best, entry) => (entry.goodsSold > best.goodsSold ? entry : best), data[0]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
        <AddCategoryButton icons={icons} />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Items"
            value={number(totals.items)}
            icon="solar:box-bold-duotone"
            goodDirection="none"
            hint={`${number(totals.active)} on the shelf · ${number(totals.retired)} retired`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Stock on the shelf"
            value={rupees(totals.stockValue, true)}
            icon="solar:safe-square-bold-duotone"
            goodDirection="none"
            hint={`${number(totals.onHandUnits)} units at selling price`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Sold"
            value={rupees(totals.goodsSold, true)}
            icon="solar:cart-check-bold-duotone"
            goodDirection="up"
            hint={`${number(totals.unitsSold)} units · ${number(totals.coinsUsed)} coins taken`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Wanted, not bought"
            value={number(totals.wanted)}
            icon="solar:heart-bold-duotone"
            goodDirection="none"
            hint="saves plus basket units"
          />
        </Grid>
      </Grid>

      <Panel
        title={`${number(data.length)} shel${data.length === 1 ? 'f' : 'ves'}`}
        subtitle={widest ? `${widest.name} has sold the most` : undefined}
        action={<AddCategoryButton icons={icons} />}
        note="A shelf added here is live for the app on its next fetch: the server sends its name and its icon with the shelf, so a phone installed last month draws one added this afternoon. The slug is what every item carries, which is why it cannot be changed afterwards."
        dense
      >
        <DataTable
          columns={[
            { label: 'Shelf' },
            { label: 'Items', align: 'right' },
            { label: 'Stock', align: 'right' },
            { label: 'Sold', align: 'right' },
            { label: 'Wanted', align: 'right' },
            { label: 'Rating', align: 'right' },
            { label: '', align: 'right', width: 140 },
          ]}
          rows={data.map(shelf => ({
            key: shelf.category,
            tone: shelf.items === 0 ? 'danger' : 'default',
            cells: [
              <Stack key="name" spacing={0.25}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <TextLink
                    href={{ pathname: paths.dashboard.catalogue, query: { category: shelf.category } }}
                    variant="subtitle2"
                  >
                    {shelf.name}
                  </TextLink>
                  <Label color="default" variant="soft">
                    {shelf.icon}
                  </Label>
                  {!shelf.shelfActive && (
                    <Label color="error" variant="soft">
                      off the app
                    </Label>
                  )}
                </Stack>
                <Mono>{shelf.category}</Mono>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {shelf.subcategories.length} subcategor{shelf.subcategories.length === 1 ? 'y' : 'ies'}
                  {shelf.unfiled > 0 ? ` · ${number(shelf.unfiled)} unfiled` : ''}
                </Typography>
              </Stack>,
              <Stack key="items" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{number(shelf.items)}</Typography>
                {shelf.retired > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {number(shelf.retired)} retired
                  </Typography>
                )}
              </Stack>,
              stockCell(shelf),
              soldCell(shelf),
              <Typography key="wanted" variant="body2" sx={{ textAlign: 'right' }}>
                {number(shelf.wanted)}
              </Typography>,
              <Stack key="rating" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{shelf.rating.count > 0 ? decimal(shelf.rating.average, 1) : '—'}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {number(shelf.rating.count)} review(s)
                </Typography>
              </Stack>,
              <CategoryRowActions
                key="actions"
                shelf={shelf}
                others={data.filter(other => other.category !== shelf.category)}
                icons={icons}
              />,
            ],
          }))}
          empty="No shelves yet — add the first one."
        />
      </Panel>

      {data.map(shelf => (
        <Panel
          key={shelf.category}
          title={shelf.name}
          subtitle={`${number(shelf.items)} item(s) · ${number(shelf.subcategories.length)} subcategor${shelf.subcategories.length === 1 ? 'y' : 'ies'}`}
          action={
            <CategoryRowActions
              shelf={shelf}
              others={data.filter(other => other.category !== shelf.category)}
              icons={icons}
            />
          }
          dense
        >
          <DataTable
            columns={[
              { label: 'Subcategory' },
              { label: 'Items', align: 'right' },
              { label: 'Stock', align: 'right' },
              { label: 'Sold', align: 'right' },
              { label: 'Wanted', align: 'right' },
              { label: '', align: 'right', width: 110 },
            ]}
            rows={[
              ...shelf.subcategories.map(sub => ({
                key: `${shelf.category}:${sub.name}`,
                cells: [
                  <Stack key="name" spacing={0.25}>
                    <Typography variant="subtitle2">{sub.name}</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {!sub.subActive && (
                        <Label color="error" variant="soft">
                          off the app
                        </Label>
                      )}
                      {sub.retired > 0 && (
                        <Label color="default" variant="soft">
                          {number(sub.retired)} retired
                        </Label>
                      )}
                    </Stack>
                  </Stack>,
                  <Typography key="items" variant="body2" sx={{ textAlign: 'right' }}>
                    {number(sub.items)}
                  </Typography>,
                  stockCell(sub),
                  soldCell(sub),
                  <Typography key="wanted" variant="body2" sx={{ textAlign: 'right' }}>
                    {number(sub.wanted)}
                  </Typography>,
                  <SubcategoryRowActions
                    key="actions"
                    category={shelf.category}
                    categoryName={shelf.name}
                    sub={sub}
                    siblings={shelf.subcategories}
                  />,
                ],
              })),
              ...(shelf.unfiled > 0
                ? [
                    {
                      key: `${shelf.category}:unfiled`,
                      tone: 'danger' as const,
                      cells: [
                        <Typography key="name" variant="subtitle2" sx={{ color: 'text.secondary' }}>
                          no subcategory
                        </Typography>,
                        <Typography key="items" variant="body2" sx={{ textAlign: 'right' }}>
                          {number(shelf.unfiled)}
                        </Typography>,
                        <Typography key="stock" variant="caption" sx={{ color: 'text.disabled', textAlign: 'right' }}>
                          —
                        </Typography>,
                        <Typography key="sold" variant="caption" sx={{ color: 'text.disabled', textAlign: 'right' }}>
                          —
                        </Typography>,
                        <Typography key="wanted" variant="caption" sx={{ color: 'text.disabled', textAlign: 'right' }}>
                          —
                        </Typography>,
                        <Typography key="actions" variant="caption" sx={{ color: 'text.disabled', textAlign: 'right' }}>
                          —
                        </Typography>,
                      ],
                    },
                  ]
                : []),
            ]}
            empty="Nothing is filed under a subcategory here — the + above adds one."
          />
        </Panel>
      ))}

      <Panel
        title="Rename or merge a subcategory"
        subtitle="Across every item that holds it"
        note="The pencil on a subcategory row does the same thing. This one also reaches a name no shelf lists — an item filed by hand, or a row imported from somewhere else. A basket and a placed order are both untouched: a basket keys on the item's slug, and an order carries its own snapshot of what was bought."
      >
        <SubcategoryForm
          categories={data.map(shelf => ({
            category: shelf.category,
            subcategories: shelf.subcategories.map(sub => ({ name: sub.name, items: sub.items })),
          }))}
        />
      </Panel>

      <Panel title="Move items onto another shelf" subtitle="Up to a hundred at a time, in one audit row">
        <MoveItemsForm categories={data} />
      </Panel>

      <Panel title="How a shelf reaches the app" subtitle="And what is fixed once it exists">
        <Kv
          items={[
            { label: 'The shelves', value: data.map(shelf => shelf.name).join(', ') || 'none yet' },
            {
              label: 'Where they live',
              value: 'shop_categories — a collection, not a contract',
              hint: 'the app is sent each shelf’s label and icon, so one added here needs no release',
            },
            {
              label: 'Fixed once created',
              value: 'the slug — every item, filter link and saved search carries it',
              hint: 'the name is what a member reads and may be changed at any time',
            },
            {
              label: 'Off the app',
              value: 'retiring a shelf hides it and leaves every item where it is',
              hint: 'deleting one has to say which shelf its items move to',
            },
            {
              label: 'Share of the shelf',
              value: data
                .filter(shelf => shelf.items > 0)
                .map(shelf => `${shelf.name} ${percent(shelf.items / Math.max(1, totals.items), 0)}`)
                .join(' · '),
            },
          ]}
        />
      </Panel>
    </Stack>
  );
}
