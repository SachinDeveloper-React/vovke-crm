import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { FilterBar, Mono, Panel, SearchFilter, SelectFilter } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { dateTime, number } from '@/src/lib/format';
import type { MediaAsset } from '@/src/lib/types';

import { MediaCard } from './media-card';
import { MediaUploadForm } from './upload-form';

interface Page {
  total: number;
  limit: number;
  offset: number;
  data: MediaAsset[];
}

/**
 * Every picture the catalogue can draw, and the only place they come from.
 *
 * A bucket on its own is not usable by a person: S3 holds opaque keys, and
 * whoever is looking for the travel bottle's photo is looking for
 * `bottle-750.jpg`, the name it had on their machine. So the filename is
 * kept as the handle, the search is on it, and — the part that makes a
 * five-hundred-product import possible at all — the spreadsheet's images
 * column matches on it too. A sheet carries names, never pictures: an
 * image embedded in a spreadsheet is anchored to a position rather than to
 * a row, so it drifts the moment anybody sorts, and a few hundred of them
 * make a file nobody can open.
 */
export async function MediaLibrary({ kind, q }: { kind?: string; q?: string }) {
  const page = await adminGet<Page>('/admin/media', { kind, q, limit: 120 });

  return (
    <Stack spacing={3}>
      <Panel
        title="Add images"
        subtitle="They go straight from this browser to the bucket"
        note="JPEG, PNG or WebP, up to 5 MB each. Keep the filenames you want to type into a spreadsheet — the importer matches that column against them, ignoring case."
      >
        <MediaUploadForm />
      </Panel>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {number(page.total)} image{page.total === 1 ? '' : 's'}
        </Typography>
        <FilterBar>
          <SearchFilter value={q ?? ''} placeholder="Search by filename" />
          <SelectFilter
            param="kind"
            label="For"
            value={kind ?? ''}
            options={[
              { value: '', label: 'Everything' },
              { value: 'shop', label: 'Shop' },
              { value: 'food', label: 'Food' },
              { value: 'plan', label: 'Diet plans' },
            ]}
          />
        </FilterBar>
      </Stack>

      {page.data.length === 0 ? (
        <Panel title="Nothing here yet">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nothing has been uploaded{q ? ' under that name' : ''}. Images added here can be put on a
            product by hand, or named in a spreadsheet&apos;s images column.
          </Typography>
        </Panel>
      ) : (
        <Grid container spacing={2}>
          {page.data.map(asset => (
            <Grid key={asset.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
              <MediaCard asset={asset} />
            </Grid>
          ))}
        </Grid>
      )}

      {page.total > page.data.length && (
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Showing the {number(page.data.length)} most recent of {number(page.total)}. Narrow by
            filename to find an older one.
          </Typography>
        </Box>
      )}

      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Uploaded images are public once they are in the bucket. Last upload:{' '}
        <Mono>{page.data[0] ? dateTime(page.data[0].uploadedAt) : '—'}</Mono>
      </Typography>
    </Stack>
  );
}
