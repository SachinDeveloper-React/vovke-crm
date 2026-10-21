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
import { LinkButton } from '@/src/components/ui/nav';
import { number, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { CatalogueItem, ShopCategory, ShopSettings } from '@/src/lib/types';

import { deleteProduct, saveProduct, type CatalogueActionState } from './actions';
import { MODES, PriceFields, ShelfFields } from './item-forms';

const BADGES = ['', 'bestseller', 'popular', 'new_arrival', 'limited'] as const;

/** `a | b` per line — how the record lists are typed and read back. */
const asLines = (records: Record<string, string | undefined>[], fields: string[]): string =>
  records.map(record => fields.map(field => record[field] ?? '').join(' | ')).join('\n');

/**
 * One product, every field.
 *
 * A patch, not an upsert: the slug is fixed because baskets and orders key
 * on it. The four record lists — colours, highlights, features, specs — are
 * typed one per line with `|` between the parts, which is both far less
 * machinery than a repeating field editor and the shape they paste in from
 * a spreadsheet as.
 */
export function ProductForm({ item, shop, shelves }: { item: CatalogueItem; shop: ShopSettings; shelves: ShopCategory[] }) {
  const [state, action, pending] = useActionState<CatalogueActionState, FormData>(saveProduct, {});
  const [price, setPrice] = useState(String(item.price / 100));
  const [coinPrice, setCoinPrice] = useState(item.coinPriceSet ? String(item.coinPrice) : '');
  const [category, setCategory] = useState(item.category);
  const [subcategory, setSubcategory] = useState(item.subcategory ?? '');

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

      {/* An unchecked switch submits nothing: the hidden `off` ahead of each
          one is what lets a flag be turned off again. */}
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="featured" value="off" />
      <input type="hidden" name="isDeal" value="off" />
      <input type="hidden" name="active" value="off" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField name="title" label="Title" size="small" fullWidth required defaultValue={item.title} disabled={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="emoji"
            label="Emoji"
            size="small"
            fullWidth
            defaultValue={item.emoji ?? '🎁'}
            disabled={pending}
            helperText="Drawn where there is no photo"
          />
        </Grid>

        <Grid size={12}>
          <TextField
            name="description"
            label="Description"
            size="small"
            fullWidth
            multiline
            minRows={2}
            defaultValue={item.description}
            disabled={pending}
          />
        </Grid>

        <PriceFields
          shop={shop}
          price={price}
          onPrice={setPrice}
          coinPrice={coinPrice}
          onCoinPrice={setCoinPrice}
          mrp={item.mrp}
          disabled={pending}
        />

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            name="paymentMode"
            label="How it may be bought"
            size="small"
            fullWidth
            defaultValue={item.paymentMode ?? ''}
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

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select name="badge" label="Badge" size="small" fullWidth defaultValue={item.badge ?? ''} disabled={pending}>
            {BADGES.map(badge => (
              <MenuItem key={badge} value={badge}>
                {badge === '' ? 'none' : badge.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="ribbon"
            label="Ribbon"
            size="small"
            fullWidth
            defaultValue={item.ribbon ?? ''}
            disabled={pending}
            helperText="Corner flash, e.g. Premium Quality"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="sizes"
            label="Sizes"
            size="small"
            fullWidth
            defaultValue={item.sizes.join(', ')}
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
            defaultValue={item.tags.join(', ')}
            disabled={pending}
            helperText="What a search should find it by"
          />
        </Grid>

        <Grid size={12}>
          <TextField
            name="images"
            label="Photos"
            size="small"
            fullWidth
            multiline
            minRows={2}
            defaultValue={item.images.join('\n')}
            disabled={pending}
            helperText="One URL per line, the cover first — the first also becomes the single-photo field older screens read"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            name="colors"
            label="Colours"
            size="small"
            fullWidth
            multiline
            minRows={3}
            defaultValue={asLines(item.colors, ['name', 'hex'])}
            disabled={pending}
            helperText="One per line: Black | #111111 — the name is what a line records, the hex only draws the swatch"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            name="highlights"
            label="Key facts"
            size="small"
            fullWidth
            multiline
            minRows={3}
            defaultValue={asLines(item.highlights, ['label', 'value'])}
            disabled={pending}
            helperText="One per line: Fabric | Dry Fit Polyester — shown beside the price"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            name="features"
            label="Key features"
            size="small"
            fullWidth
            multiline
            minRows={3}
            defaultValue={asLines(item.features, ['title', 'caption'])}
            disabled={pending}
            helperText="One per line: Breathable | Keeps you cool and dry"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            name="specs"
            label="Product information"
            size="small"
            fullWidth
            multiline
            minRows={3}
            defaultValue={asLines(item.specs, ['label', 'value'])}
            disabled={pending}
            helperText="One per line: Material | 100% Polyester"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField name="sort" label="Shelf order" type="number" size="small" fullWidth defaultValue={item.sort} disabled={pending} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <FormControlLabel
              control={<Switch name="active" defaultChecked={item.active} disabled={pending} />}
              label={<Typography variant="body2">On the shelf</Typography>}
            />
            <FormControlLabel
              control={<Switch name="featured" defaultChecked={item.featured} disabled={pending} />}
              label={<Typography variant="body2">Featured</Typography>}
            />
            <FormControlLabel
              control={<Switch name="isDeal" defaultChecked={item.isDeal} disabled={pending} />}
              label={<Typography variant="body2">A deal</Typography>}
            />
          </Stack>
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          Save the product
        </Button>
      </Box>
    </Stack>
  );
}

/**
 * Deleting one outright.
 *
 * Two different acts sit next to each other on this page and only one is
 * reversible, so this one asks for the slug to be typed and says plainly
 * what the other one does instead. An item any order holds is refused by the
 * API — the link from an order back to the product is what support follows.
 */
export function ProductDelete({ item, orders }: { item: CatalogueItem; orders: number }) {
  const [state, action, pending] = useActionState<CatalogueActionState, FormData>(deleteProduct, {});
  const held = orders > 0;

  return (
    <Stack component="form" action={action} spacing={1.5}>
      <input type="hidden" name="id" value={item.id} />
      {state.ok && (
        <Alert
          severity="success"
          variant="outlined"
          action={
            <LinkButton href={paths.dashboard.catalogue} size="small" color="inherit">
              Back to the catalogue
            </LinkButton>
          }
        >
          {state.ok}
        </Alert>
      )}
      {state.error && (
        <Alert severity="error" variant="outlined">
          {state.error}
        </Alert>
      )}

      {held ? (
        <Alert severity="info" variant="outlined">
          {number(orders)} order(s) hold {item.id}, so it cannot be deleted — that would break the link from those
          orders back to the product. Retiring it takes it off the member’s shelf and leaves their history intact.
        </Alert>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No order holds {item.id}, so it can be removed outright. Its stock row, any basket line pointing at it, every
          save and every review go with it — a basket line pointing at a row that has gone is one the member can
          neither see nor remove.
        </Typography>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
        <TextField name="confirm" label={`Type ${item.id}`} size="small" disabled={pending || held} sx={{ width: 220 }} />
        <TextField name="note" label="Note" size="small" disabled={pending || held} sx={{ width: 200 }} />
        <Button
          type="submit"
          color="error"
          variant="outlined"
          loading={pending}
          disabled={held}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
        >
          Delete it
        </Button>
      </Stack>
      {held && (
        <Label color="default" variant="soft" sx={{ alignSelf: 'flex-start' }}>
          retire it instead — {rupees(item.price)}, {number(item.sold.units)} sold
        </Label>
      )}
    </Stack>
  );
}
