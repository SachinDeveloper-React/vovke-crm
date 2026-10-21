'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
// Straight from the module rather than the `components/ui` barrel: the
// barrel also exports `ApiErrorNotice`, which imports `lib/api` and so
// `server-only` — and pulling that into a client component fails the build.
import { DialogButton } from '@/src/components/ui/dialog-button';
import { coins, number, rupees } from '@/src/lib/format';
import { slugify } from '@/src/lib/slug';
import type { CatalogueItem, ShopCategory, ShopSettings } from '@/src/lib/types';

import { patchItem, retireItem, saveItem, setStock, type CatalogueActionState } from './actions';

const BADGES = ['', 'bestseller', 'popular', 'new_arrival', 'limited'] as const;

export const MODES = [
  { value: '', label: 'Follow the shop’s mode' },
  { value: 'coins', label: 'Coins only — a reward' },
  { value: 'money', label: 'Money only' },
  { value: 'mixed', label: 'Coins + money' },
] as const;

/**
 * The two shelf dropdowns, and why the second one is a dropdown at all.
 *
 * A subcategory is free text on the item, which is exactly how "T-Shirts"
 * ends up beside "T-shirts" — two shelves to a member, one typo to
 * everybody else. The shelf lists its subcategories now, so this offers
 * them instead: a name that is not on the list is added on Categories
 * first, and the API refuses one that was never added.
 */
export function ShelfFields({
  shelves,
  category,
  onCategory,
  subcategory,
  onSubcategory,
  disabled,
}: {
  shelves: ShopCategory[];
  category: string;
  onCategory: (value: string) => void;
  subcategory: string;
  onSubcategory: (value: string) => void;
  disabled?: boolean;
}) {
  const shelf = shelves.find(entry => entry.category === category);
  const subcategories = shelf?.subcategories ?? [];

  return (
    <>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          select
          name="category"
          label="Category"
          size="small"
          fullWidth
          required
          value={shelves.some(entry => entry.category === category) ? category : ''}
          onChange={event => {
            onCategory(event.target.value);
            // The old shelf's subcategory means nothing on the new one, and
            // the API refuses it — so moving shelf clears it rather than
            // leaving a dropdown showing a name that is not in its list.
            onSubcategory('');
          }}
          disabled={disabled}
          helperText={shelf && !shelf.shelfActive ? 'This shelf is off the app' : undefined}
        >
          {shelves.map(entry => (
            <MenuItem key={entry.category} value={entry.category}>
              {entry.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          select
          name="subcategory"
          label="Subcategory"
          size="small"
          fullWidth
          value={subcategories.some(sub => sub.name === subcategory) ? subcategory : ''}
          onChange={event => onSubcategory(event.target.value)}
          disabled={disabled || !shelf}
          helperText={
            subcategories.length === 0 ? 'This shelf has none — add one on Categories' : 'Added and renamed on Categories'
          }
        >
          <MenuItem value="">— none —</MenuItem>
          {subcategories.map(sub => (
            <MenuItem key={sub.name} value={sub.name}>
              {sub.name} ({sub.items})
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </>
  );
}

/**
 * What a thing costs, in both currencies.
 *
 * Rupees is the price and is required. Coins is the question an operator
 * actually asks — "how do I say this is a 2,000-coin reward?" — and the
 * answer used to be "you cannot": the till divided the rupee price by ⚙
 * `commerce.coinValuePaise` and whatever came out was the coin price. The
 * box is empty by default and the helper says what that arithmetic gives,
 * so leaving it alone is the old behaviour and typing in it is the new one.
 */
export function PriceFields({
  shop,
  price,
  onPrice,
  coinPrice,
  onCoinPrice,
  mrp,
  disabled,
}: {
  shop: ShopSettings;
  price: string;
  onPrice: (value: string) => void;
  coinPrice: string;
  onCoinPrice: (value: string) => void;
  mrp?: number | null;
  disabled?: boolean;
}) {
  const derived = Math.ceil(((Number(price) || 0) * 100) / shop.coinValuePaise);
  const typed = Number(coinPrice);

  return (
    <>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          name="price"
          label="Price in rupees"
          type="number"
          size="small"
          fullWidth
          required
          value={price}
          onChange={event => onPrice(event.target.value)}
          disabled={disabled}
          helperText={`₹${shop.coinValuePaise / 100} a coin at the till`}
          slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          name="coinPrice"
          label="Price in coins"
          type="number"
          size="small"
          fullWidth
          value={coinPrice}
          onChange={event => onCoinPrice(event.target.value)}
          disabled={disabled}
          placeholder={String(derived)}
          helperText={
            coinPrice === ''
              ? `Empty = ${coins(derived)} coins, the price divided out`
              : Number.isFinite(typed) && typed > 0
                ? `Charged ${coins(typed)} coins when coins pay all of it`
                : 'A whole number of coins'
          }
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          name="mrp"
          label="Struck-through price"
          type="number"
          size="small"
          fullWidth
          defaultValue={mrp ? mrp / 100 : ''}
          disabled={disabled}
          helperText="Optional; shown crossed out"
          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
        />
      </Grid>
    </>
  );
}

/**
 * Listing a thing, or rewriting it.
 *
 * `paymentMode` is the field this form exists for: an item's own mode beats
 * the shop's, so a coins-only reward can sit on the same shelf as a
 * money-only product. Empty is not missing — it means "whatever the shop
 * does", and the helper text says which that currently is.
 *
 * The slug writes itself from the title. It is the id a basket line keys
 * on, so it is fixed the moment the item exists; deriving it is what stops
 * somebody inventing `Travel-Bottle` at eleven at night, and it stays
 * editable because the derived one is occasionally not the one the links
 * should carry.
 */
export function ItemForm({ shop, shelves, item }: { shop: ShopSettings; shelves: ShopCategory[]; item?: CatalogueItem }) {
  const [state, action, pending] = useActionState<CatalogueActionState, FormData>(saveItem, {});
  const [title, setTitle] = useState(item?.title ?? '');
  const [slug, setSlug] = useState(item?.id ?? '');
  const [slugTyped, setSlugTyped] = useState(Boolean(item));
  const [price, setPrice] = useState(item ? String(item.price / 100) : '');
  const [coinPrice, setCoinPrice] = useState(item?.coinPriceSet ? String(item.coinPrice) : '');
  const [category, setCategory] = useState(item?.category ?? shelves[0]?.category ?? '');
  const [subcategory, setSubcategory] = useState(item?.subcategory ?? '');

  const derivedSlug = slugTyped ? slug : slugify(title);

  return (
    <Stack component="form" action={action} spacing={2}>
      {state.ok && (
        <Alert severity="success" variant="outlined">
          {state.ok}
        </Alert>
      )}
      {state.error && (
        <Alert severity="error" variant="outlined">
          {state.error}
        </Alert>
      )}

      {/* An unchecked switch submits nothing: the hidden `off` ahead of
          each one is what lets a flag be turned off again. */}
      <input type="hidden" name="featured" value="off" />
      <input type="hidden" name="isDeal" value="off" />
      <input type="hidden" name="active" value="off" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            name="title"
            label="Title"
            size="small"
            fullWidth
            required
            value={title}
            onChange={event => setTitle(event.target.value)}
            disabled={pending}
            helperText="What a member reads on the card"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="id"
            label="Slug"
            size="small"
            fullWidth
            required
            value={derivedSlug}
            onChange={event => {
              setSlugTyped(true);
              setSlug(event.target.value);
            }}
            disabled={pending || Boolean(item)}
            helperText={item ? 'Fixed: baskets and orders key on it' : 'Written from the title'}
          />
        </Grid>

        <PriceFields
          shop={shop}
          price={price}
          onPrice={setPrice}
          coinPrice={coinPrice}
          onCoinPrice={setCoinPrice}
          mrp={item?.mrp}
          disabled={pending}
        />

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            name="paymentMode"
            label="How it may be bought"
            size="small"
            fullWidth
            defaultValue={item?.paymentMode ?? ''}
            disabled={pending}
            helperText={`The shop’s own mode is “${shop.paymentMode}”`}
          >
            {MODES.map(mode => (
              <MenuItem key={mode.value} value={mode.value}>
                {mode.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <ShelfFields
          shelves={shelves}
          category={category}
          onCategory={setCategory}
          subcategory={subcategory}
          onSubcategory={setSubcategory}
          disabled={pending}
        />

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select name="badge" label="Badge" size="small" fullWidth defaultValue={item?.badge ?? ''} disabled={pending}>
            {BADGES.map(badge => (
              <MenuItem key={badge} value={badge}>
                {badge === '' ? 'none' : badge.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField name="emoji" label="Emoji" size="small" fullWidth defaultValue={item?.emoji ?? '🎁'} disabled={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField name="imageUrl" label="Image URL" size="small" fullWidth defaultValue={item?.imageUrl ?? ''} disabled={pending} />
        </Grid>

        <Grid size={12}>
          <TextField
            name="description"
            label="Description"
            size="small"
            fullWidth
            multiline
            minRows={2}
            defaultValue={item?.description ?? ''}
            disabled={pending}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="sizes"
            label="Sizes"
            size="small"
            fullWidth
            defaultValue={(item?.sizes ?? []).join(', ')}
            disabled={pending}
            helperText="Comma-separated; blank for one-size"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="tags"
            label="Tags"
            size="small"
            fullWidth
            defaultValue={(item?.tags ?? []).join(', ')}
            disabled={pending}
            helperText="What a search should find it by"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="onHand"
            label="In stock"
            type="number"
            size="small"
            fullWidth
            defaultValue={item?.stock.onHand ?? 0}
            disabled={pending}
            slotProps={{ htmlInput: { min: 0 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="lowStockAt"
            label="Low below"
            type="number"
            size="small"
            fullWidth
            defaultValue={item?.stock.lowStockAt ?? 5}
            disabled={pending}
            slotProps={{ htmlInput: { min: 0 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="sort"
            label="Sort order"
            type="number"
            size="small"
            fullWidth
            defaultValue={item?.sort ?? 0}
            disabled={pending}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>

        <Grid size={12}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <FormControlLabel
              control={<Switch name="active" defaultChecked={item?.active ?? true} disabled={pending} />}
              label={<Typography variant="body2">On the shelf</Typography>}
            />
            <FormControlLabel
              control={<Switch name="featured" defaultChecked={item?.featured ?? false} disabled={pending} />}
              label={<Typography variant="body2">Featured</Typography>}
            />
            <FormControlLabel
              control={<Switch name="isDeal" defaultChecked={item?.isDeal ?? false} disabled={pending} />}
              label={<Typography variant="body2">A deal</Typography>}
            />
          </Stack>
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          {item ? 'Save the item' : 'List it'}
        </Button>
      </Box>
    </Stack>
  );
}

/** The button at the top of the catalogue: the form, in a dialog. */
export function NewProductButton({ shop, shelves }: { shop: ShopSettings; shelves: ShopCategory[] }) {
  return (
    <DialogButton
      label="Add a product"
      icon="mingcute:add-line"
      variant="contained"
      color="primary"
      maxWidth="md"
      title="A new product"
      subtitle="The slug writes itself from the title, and the shelf comes from Categories. Everything else — photos, colours, the product page’s facts — is on the product itself once it exists."
      disabled={shelves.length === 0}
    >
      <ItemForm shop={shop} shelves={shelves} />
    </DialogButton>
  );
}

/** The three edits a shelf actually needs in a hurry, on the row itself. */
export function QuickEdit({ item }: { item: CatalogueItem }) {
  const [priceState, priceAction, pricePending] = useActionState<CatalogueActionState, FormData>(patchItem, {});
  const [stockState, stockAction, stockPending] = useActionState<CatalogueActionState, FormData>(setStock, {});
  const [retireState, retireAction, retirePending] = useActionState<CatalogueActionState, FormData>(retireItem, {});

  const said = priceState.ok || stockState.ok || retireState.ok;
  const wrong = priceState.error || stockState.error || retireState.error;

  return (
    <Stack spacing={1} sx={{ minWidth: 260 }}>
      {said && (
        <Alert severity="success" variant="outlined" sx={{ py: 0 }}>
          <Typography variant="caption">{said}</Typography>
        </Alert>
      )}
      {wrong && (
        <Alert severity="error" variant="outlined" sx={{ py: 0 }}>
          <Typography variant="caption">{wrong}</Typography>
        </Alert>
      )}

      <Stack component="form" action={priceAction} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="note" value="quick edit" />
        <TextField
          name="price"
          label="₹"
          type="number"
          size="small"
          defaultValue={item.price / 100}
          disabled={pricePending}
          sx={{ width: 110 }}
          slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
        />
        <TextField
          select
          name="paymentMode"
          label="Mode"
          size="small"
          defaultValue={item.paymentMode ?? ''}
          disabled={pricePending}
          sx={{ width: 120 }}
        >
          {MODES.map(mode => (
            <MenuItem key={mode.value} value={mode.value}>
              {mode.value === '' ? 'shop' : mode.value}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" size="small" variant="outlined" loading={pricePending}>
          Save
        </Button>
      </Stack>

      <Stack component="form" action={stockAction} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="reason" value="counted from the panel" />
        <TextField
          name="onHand"
          label="Stock"
          type="number"
          size="small"
          defaultValue={item.stock.onHand}
          disabled={stockPending}
          sx={{ width: 110 }}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <Button type="submit" size="small" variant="outlined" loading={stockPending}>
          Set
        </Button>
        <Box sx={{ flex: 1 }} />
        <Box component="form" action={retireAction}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="active" value={item.active ? 'false' : 'true'} />
          <Button type="submit" size="small" color={item.active ? 'error' : 'primary'} loading={retirePending}>
            {item.active ? 'Retire' : 'Restore'}
          </Button>
        </Box>
      </Stack>

      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {rupees(item.price)} · {coins(item.coinPrice)} coins{item.coinPriceSet ? ' (set)' : ''} · {number(item.sold.units)} sold
        {item.stock.out ? ' · out of stock' : item.stock.low ? ' · low' : ''}
        {item.active ? '' : ' · off the shelf'}
      </Typography>
      {!item.active && (
        <Label color="default" variant="soft">
          retired, and its orders are untouched
        </Label>
      )}
    </Stack>
  );
}
