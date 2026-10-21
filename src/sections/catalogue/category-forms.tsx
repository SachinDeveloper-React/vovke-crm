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
// Straight from the module rather than the `components/ui` barrel: the
// barrel also exports `ApiErrorNotice`, which imports `lib/api` and so
// `server-only` — and pulling that into a client component fails the build.
import { DialogButton, DialogIconButton } from '@/src/components/ui/dialog-button';
import { slugify } from '@/src/lib/slug';
import type { ShopCategory, ShopSubcategory } from '@/src/lib/types';

import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  moveItems,
  renameSubcategory,
  updateCategory,
  updateSubcategory,
  type CategoryActionState,
} from './category-actions';

/** The answer an action came back with, in the same place in every form. */
function Said({ state }: { state: CategoryActionState }) {
  return (
    <>
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
    </>
  );
}

/** `shirt` → `Shirt`: the icon keys are single words, so this is the whole of it. */
const iconLabel = (icon: string): string => icon.charAt(0).toUpperCase() + icon.slice(1);

/**
 * A shelf, new or being rewritten.
 *
 * The slug is the only field that behaves differently between the two: it
 * is what every item carries, so it is typed once and then fixed. The form
 * derives it from the name as it is typed — which is what somebody adding
 * "Yoga & Pilates" expects — and still lets it be overridden, because the
 * derived one is occasionally not the one the links should carry.
 */
export function CategoryForm({ shelf, icons }: { shelf?: ShopCategory; icons: string[] }) {
  const [state, action, pending] = useActionState<CategoryActionState, FormData>(
    shelf ? updateCategory : createCategory,
    {},
  );
  const [name, setName] = useState(shelf?.name ?? '');
  const [slug, setSlug] = useState(shelf?.category ?? '');
  // Once somebody types a slug it is theirs: the name stops writing it.
  const [slugTyped, setSlugTyped] = useState(Boolean(shelf));

  const derived = slugTyped ? slug : slugify(name);

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />

      {/* An unchecked switch submits nothing: the hidden `off` is what lets a shelf be retired. */}
      <input type="hidden" name="active" value="off" />
      {shelf && <input type="hidden" name="slug" value={shelf.category} />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 7 }}>
          <TextField
            name="name"
            label="Name"
            size="small"
            fullWidth
            required
            value={name}
            onChange={event => setName(event.target.value)}
            disabled={pending}
            helperText="What a member reads on the chip and the tile"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            {...(shelf ? {} : { name: 'slug' })}
            label="Slug"
            size="small"
            fullWidth
            value={derived}
            onChange={event => {
              setSlugTyped(true);
              setSlug(event.target.value);
            }}
            disabled={pending || Boolean(shelf)}
            helperText={shelf ? 'Fixed: every item carries it' : 'Written from the name; lowercase-with-hyphens'}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            name="icon"
            label="Icon"
            size="small"
            fullWidth
            defaultValue={shelf?.icon ?? 'category'}
            disabled={pending}
            helperText="The glyph the app draws it with"
          >
            {icons.map(icon => (
              <MenuItem key={icon} value={icon}>
                {iconLabel(icon)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="sort"
            label="Order"
            type="number"
            size="small"
            fullWidth
            defaultValue={shelf?.sort ?? ''}
            disabled={pending}
            helperText="Smallest first"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <FormControlLabel
            control={<Switch name="active" defaultChecked={shelf?.shelfActive ?? true} disabled={pending} />}
            label={<Typography variant="body2">On the app</Typography>}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            name="description"
            label="Description"
            size="small"
            fullWidth
            defaultValue={shelf?.description ?? ''}
            disabled={pending}
            helperText="For the panel; the app shows the name alone"
          />
        </Grid>
        <Grid size={12}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          {shelf ? 'Save the shelf' : 'Add the shelf'}
        </Button>
      </Box>
    </Stack>
  );
}

/**
 * Deleting a shelf, which is really a question about its items.
 *
 * An item whose `category` names a shelf that has gone is an item no filter
 * finds and no tile counts, so the API refuses this while anything is on it
 * and nothing says where those go. Retiring it instead — the switch on the
 * form above — takes it off the app and leaves every item where it is.
 */
export function CategoryDelete({ shelf, others }: { shelf: ShopCategory; others: ShopCategory[] }) {
  const [state, action, pending] = useActionState<CategoryActionState, FormData>(deleteCategory, {});

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />
      <input type="hidden" name="slug" value={shelf.category} />

      {shelf.items > 0 ? (
        <Alert severity="info" variant="outlined">
          {shelf.items} item(s) are on {shelf.name}. Say which shelf they move to — they arrive unfiled, because the
          subcategory each one is under belongs to this shelf.
        </Alert>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Nothing is on {shelf.name}, so it can go. Its subcategories go with it.
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            name="moveTo"
            label="Move its items to"
            size="small"
            fullWidth
            defaultValue=""
            required={shelf.items > 0}
            disabled={pending || others.length === 0}
            helperText={shelf.items > 0 ? 'Required while items are on it' : 'Nothing to move'}
          >
            <MenuItem value="">— nowhere —</MenuItem>
            {others.map(other => (
              <MenuItem key={other.category} value={other.category}>
                {other.name} ({other.items})
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="confirm"
            label={`Type ${shelf.category}`}
            size="small"
            fullWidth
            disabled={pending}
            helperText="This cannot be undone"
          />
        </Grid>
        <Grid size={12}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button
          type="submit"
          color="error"
          variant="outlined"
          loading={pending}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
        >
          Delete the shelf
        </Button>
      </Box>
    </Stack>
  );
}

/**
 * A subcategory, new or being renamed.
 *
 * Renaming writes the new name across every item filed under the old one,
 * and renaming onto a name the shelf already has is how two are merged —
 * which is the fix for "T-Shirts" beside "T-shirts", two shelves to a
 * member and one typo to everybody else.
 */
export function SubcategoryEditForm({
  category,
  categoryName,
  sub,
}: {
  category: string;
  categoryName: string;
  sub?: ShopSubcategory;
}) {
  const [state, action, pending] = useActionState<CategoryActionState, FormData>(
    sub ? updateSubcategory : createSubcategory,
    {},
  );

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />

      <input type="hidden" name="category" value={category} />
      {sub && <input type="hidden" name="from" value={sub.name} />}
      {sub && <input type="hidden" name="active" value="off" />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: sub ? 6 : 8 }}>
          <TextField
            name="name"
            label="Name"
            size="small"
            fullWidth
            required
            defaultValue={sub?.name ?? ''}
            disabled={pending}
            helperText={sub ? `A name ${categoryName} already has merges the two` : `Under ${categoryName}`}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="sort"
            label="Order"
            type="number"
            size="small"
            fullWidth
            defaultValue={sub?.sort ?? ''}
            disabled={pending}
          />
        </Grid>
        {sub && (
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControlLabel
              control={<Switch name="active" defaultChecked={sub.subActive} disabled={pending} />}
              label={<Typography variant="body2">On the app</Typography>}
            />
          </Grid>
        )}
        <Grid size={12}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          {sub ? 'Save it' : 'Add it'}
        </Button>
      </Box>
    </Stack>
  );
}

/** Removing a subcategory: the only question is where its items are filed instead. */
export function SubcategoryDelete({
  category,
  categoryName,
  sub,
  siblings,
}: {
  category: string;
  categoryName: string;
  sub: ShopSubcategory;
  siblings: ShopSubcategory[];
}) {
  const [state, action, pending] = useActionState<CategoryActionState, FormData>(deleteSubcategory, {});

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="name" value={sub.name} />

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {sub.items > 0
          ? `${sub.items} item(s) are filed under “${sub.name}” on ${categoryName}. They stay on the shelf — this only decides what they are filed under.`
          : `Nothing is filed under “${sub.name}”.`}
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            name="reassignTo"
            label="File its items under"
            size="small"
            fullWidth
            defaultValue=""
            disabled={pending}
            helperText="Nothing leaves them unfiled, which is a perfectly ordinary item"
          >
            <MenuItem value="">— nothing —</MenuItem>
            {siblings
              .filter(other => other.name !== sub.name)
              .map(other => (
                <MenuItem key={other.name} value={other.name}>
                  {other.name} ({other.items})
                </MenuItem>
              ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button
          type="submit"
          color="error"
          variant="outlined"
          loading={pending}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
        >
          Delete it
        </Button>
      </Box>
    </Stack>
  );
}

// ─── The buttons the shelf table hangs these on ────────────────────────────

/** The one on top of the page. */
export function AddCategoryButton({ icons }: { icons: string[] }) {
  return (
    <DialogButton
      label="Add a shelf"
      icon="mingcute:add-line"
      variant="contained"
      color="primary"
      title="A new shelf"
      subtitle="The slug is what every item on it will carry, so it is typed once and then fixed."
    >
      <CategoryForm icons={icons} />
    </DialogButton>
  );
}

/** Rename, re-order, retire, delete — the four things a shelf row offers. */
export function CategoryRowActions({
  shelf,
  others,
  icons,
}: {
  shelf: ShopCategory;
  others: ShopCategory[];
  icons: string[];
}) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
      <DialogIconButton
        icon="solar:pen-bold-duotone"
        tooltip={`Edit ${shelf.name}`}
        title={shelf.name}
        subtitle={`The slug stays ${shelf.category} — every item carries it.`}
      >
        <CategoryForm shelf={shelf} icons={icons} />
      </DialogIconButton>
      <DialogIconButton
        icon="mingcute:add-line"
        tooltip={`Add a subcategory to ${shelf.name}`}
        color="primary"
        title={`A subcategory of ${shelf.name}`}
        subtitle="What the item form's second dropdown offers."
      >
        <SubcategoryEditForm category={shelf.category} categoryName={shelf.name} />
      </DialogIconButton>
      <DialogIconButton
        icon="solar:trash-bin-trash-bold-duotone"
        tooltip={`Delete ${shelf.name}`}
        color="error"
        title={`Delete ${shelf.name}`}
        subtitle="Retiring it instead leaves every item where it is."
      >
        <CategoryDelete shelf={shelf} others={others} />
      </DialogIconButton>
    </Stack>
  );
}

/** The same two on a subcategory row. */
export function SubcategoryRowActions({
  category,
  categoryName,
  sub,
  siblings,
}: {
  category: string;
  categoryName: string;
  sub: ShopSubcategory;
  siblings: ShopSubcategory[];
}) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
      <DialogIconButton
        icon="solar:pen-bold-duotone"
        tooltip={`Rename ${sub.name}`}
        title={sub.name}
        subtitle={`Under ${categoryName}. A rename is written across every item that holds it.`}
      >
        <SubcategoryEditForm category={category} categoryName={categoryName} sub={sub} />
      </DialogIconButton>
      <DialogIconButton
        icon="solar:trash-bin-trash-bold-duotone"
        tooltip={`Delete ${sub.name}`}
        color="error"
        title={`Delete ${sub.name}`}
        subtitle={`Its items stay on ${categoryName}.`}
      >
        <SubcategoryDelete category={category} categoryName={categoryName} sub={sub} siblings={siblings} />
      </DialogIconButton>
    </Stack>
  );
}

// ─── The two bulk writes ───────────────────────────────────────────────────

/**
 * Renaming a shelf's free text, and merging two of them.
 *
 * The row-level pencil above is the one to reach for. This one still earns
 * its place for the name no shelf lists — an item filed by hand, a row
 * imported from somewhere else — which is why the "from" is a dropdown of
 * what is actually on the items.
 */
export function SubcategoryForm({
  categories,
}: {
  categories: { category: string; subcategories: { name: string; items: number }[] }[];
}) {
  const [state, action, pending] = useActionState<CategoryActionState, FormData>(renameSubcategory, {});
  const [category, setCategory] = useState(categories[0]?.category ?? '');

  const names = categories.find(entry => entry.category === category)?.subcategories ?? [];

  return (
    <Stack component="form" action={action} spacing={2}>
      <Said state={state} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            select
            name="category"
            label="Category"
            size="small"
            fullWidth
            value={category}
            onChange={event => setCategory(event.target.value)}
            disabled={pending}
          >
            {categories.map(entry => (
              <MenuItem key={entry.category} value={entry.category}>
                {entry.category}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            select
            name="from"
            label="Rename"
            size="small"
            fullWidth
            defaultValue=""
            disabled={pending || names.length === 0}
            helperText={names.length === 0 ? 'Nothing filed under this one' : 'As it is typed now'}
          >
            {names.map(entry => (
              <MenuItem key={entry.name} value={entry.name}>
                {entry.name} ({entry.items})
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            name="to"
            label="To"
            size="small"
            fullWidth
            disabled={pending}
            helperText="An existing name merges them; empty unfiles them"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button
          type="submit"
          variant="contained"
          loading={pending}
          startIcon={<Iconify icon="solar:text-field-focus-bold-duotone" />}
        >
          Rename across the items
        </Button>
      </Box>
    </Stack>
  );
}

/**
 * Moving items between shelves.
 *
 * Slugs pasted in rather than a picker: the list this is used from is a
 * filtered catalogue page, and copying a column of slugs out of it is both
 * faster and auditable — the audit row keeps each item's old shelf.
 */
export function MoveItemsForm({ categories }: { categories: ShopCategory[] }) {
  const [state, action, pending] = useActionState<CategoryActionState, FormData>(moveItems, {});
  const [category, setCategory] = useState(categories[0]?.category ?? '');

  const subcategories = categories.find(entry => entry.category === category)?.subcategories ?? [];

  return (
    <Stack component="form" action={action} spacing={2}>
      <Said state={state} />

      <input type="hidden" name="clearSubcategory" value="off" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            name="ids"
            label="Slugs"
            size="small"
            fullWidth
            multiline
            minRows={3}
            disabled={pending}
            helperText="One per line, or comma-separated — up to a hundred"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2}>
            <TextField
              select
              name="category"
              label="Move them to"
              size="small"
              fullWidth
              value={category}
              onChange={event => setCategory(event.target.value)}
              disabled={pending}
            >
              {categories.map(entry => (
                <MenuItem key={entry.category} value={entry.category}>
                  {entry.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              name="subcategory"
              label="Subcategory"
              size="small"
              fullWidth
              defaultValue=""
              disabled={pending}
              helperText="Empty leaves each item’s own as it is"
            >
              <MenuItem value="">— leave them as they are —</MenuItem>
              {subcategories.map(sub => (
                <MenuItem key={sub.name} value={sub.name}>
                  {sub.name} ({sub.items})
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={<Switch name="clearSubcategory" disabled={pending} />}
              label={<Typography variant="body2">Unfile them instead</Typography>}
            />
            <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
          </Stack>
        </Grid>
      </Grid>

      <Box>
        <Button
          type="submit"
          variant="contained"
          loading={pending}
          startIcon={<Iconify icon="solar:arrow-right-bold-duotone" />}
        >
          Move them
        </Button>
      </Box>
    </Stack>
  );
}
