import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  FilterBar,
  OffsetPager,
  Panel,
  RowLink,
  SearchFilter,
  SelectFilter,
  Stat,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, decimal, number, percent } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { Reviews } from '@/src/lib/types';

import { ReviewDelete } from './review-forms';

export type ReviewsQuery = {
  q: string;
  itemId: string;
  rating: string;
  verified: string;
  sort: string;
  limit: number;
  offset: number;
};

/** ★★★☆☆ — read faster than a number in a column of them. */
function Stars({ rating }: { rating: number }) {
  return (
    <Typography
      variant="body2"
      sx={{ color: rating <= 2 ? 'error.main' : rating === 3 ? 'warning.main' : 'success.main', whiteSpace: 'nowrap' }}
    >
      {'★'.repeat(rating)}
      <Typography component="span" variant="body2" sx={{ color: 'text.disabled' }}>
        {'★'.repeat(5 - rating)}
      </Typography>
    </Typography>
  );
}

/**
 * What members wrote on the product pages (RULES R15).
 *
 * Worst first is the default sort, because that is the queue: a one-star
 * review is either a product problem to fix or a review to take down, and
 * both need somebody to have read it. Everything else here is one page of
 * four stars nobody needs to act on.
 *
 * `verified` was decided when the review was written and is never revisited —
 * a review written after buying stays a buyer's review even if the order was
 * later refunded. `stillHoldsAnOrder` is the live question beside it.
 */
export async function ReviewsView({ query }: { query: ReviewsQuery }) {
  const reviews = await adminGet<Reviews>('/admin/shop/reviews', {
    q: query.q,
    itemId: query.itemId || undefined,
    rating: query.rating || undefined,
    verified: query.verified || 'any',
    sort: query.sort,
    limit: query.limit,
    offset: query.offset,
  });
  const { summary, data } = reviews;

  const unhappy = summary.histogram.filter(row => row.rating <= 2).reduce((sum, row) => sum + row.reviews, 0);
  const verified = data.filter(row => row.verified).length;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Reviews"
            value={number(summary.reviews)}
            icon="solar:chat-square-like-bold-duotone"
            goodDirection="none"
            hint="across this filter"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Average"
            value={decimal(summary.average, 1)}
            icon="solar:star-bold-duotone"
            goodDirection="up"
            hint="out of 5"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="One or two stars"
            value={number(unhappy)}
            icon="solar:sad-circle-bold-duotone"
            goodDirection="down"
            hint={summary.reviews > 0 ? `${percent(unhappy / summary.reviews, 0)} of them` : 'nothing yet'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Verified on this page"
            value={number(verified)}
            icon="solar:verified-check-bold-duotone"
            goodDirection="none"
            hint="had bought it when they wrote it"
          />
        </Grid>
      </Grid>

      <Panel title="The spread" subtitle="Across this filter" note="Five bars rather than a chart: there are five values, and the count beside each is the figure anybody would read off it.">
        <Stack spacing={1}>
          {[...summary.histogram].reverse().map(row => {
            const share = summary.reviews === 0 ? 0 : row.reviews / summary.reviews;
            return (
              <Stack key={row.rating} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Stars rating={row.rating} />
                <Stack
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 1,
                    bgcolor: 'var(--mui-palette-action-hover)',
                    overflow: 'hidden',
                  }}
                >
                  <Stack
                    sx={{
                      width: `${Math.round(share * 100)}%`,
                      height: 1,
                      borderRadius: 1,
                      bgcolor: row.rating <= 2 ? 'error.main' : row.rating === 3 ? 'warning.main' : 'success.main',
                    }}
                  />
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary', width: 90, textAlign: 'right' }}>
                  {number(row.reviews)} · {percent(share, 0)}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Panel>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Words, author, or an item slug" />
        <SelectFilter
          label="Rating"
          param="rating"
          value={query.rating}
          options={[
            { value: '', label: 'Any rating' },
            ...[1, 2, 3, 4, 5].map(value => ({ value: String(value), label: `${value} star${value === 1 ? '' : 's'}` })),
          ]}
          width={140}
        />
        <SelectFilter
          label="Bought it"
          param="verified"
          value={query.verified}
          options={[
            { value: 'any', label: 'Either' },
            { value: 'yes', label: 'Verified' },
            { value: 'no', label: 'Not verified' },
          ]}
          width={150}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'lowest', label: 'Worst first' },
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'highest', label: 'Best first' },
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
        title={`${number(reviews.total)} review${reviews.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : query.sort === 'lowest' ? 'worst first' : undefined}
        dense
      >
        <DataTable
          columns={[
            { label: 'Rating', width: 110 },
            { label: 'What they wrote' },
            { label: 'Item' },
            { label: 'Member' },
            { label: 'Take it down', width: 280 },
          ]}
          rows={data.map(review => ({
            key: review.id,
            tone: review.rating <= 2 ? 'danger' : 'default',
            cells: [
              <Stack key="rating" spacing={0.5}>
                <Stars rating={review.rating} />
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {ago(review.createdAt)}
                </Typography>
              </Stack>,
              <Stack key="body" spacing={0.25} sx={{ maxWidth: 420 }}>
                {review.title && <Typography variant="subtitle2">{review.title}</Typography>}
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {review.body}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Label color={review.verified ? 'success' : 'default'} variant="soft">
                    {review.verified ? 'verified buyer' : 'not verified'}
                  </Label>
                  {review.verified && !review.stillHoldsAnOrder && (
                    <Label color="warning" variant="soft">
                      no order now
                    </Label>
                  )}
                  <Label color="default" variant="soft">
                    signed {review.authorName}
                  </Label>
                </Stack>
              </Stack>,
              <Stack key="item" spacing={0.25}>
                <RowLink
                  href={{ pathname: paths.dashboard.catalogueItem(review.item.id) }}
                  secondary={`${decimal(review.item.rating.average, 1)} from ${number(review.item.rating.count)}`}
                >
                  {review.item.emoji ? `${review.item.emoji} ` : ''}
                  {review.item.title}
                </RowLink>
                {!review.item.active && (
                  <Label color="error" variant="soft">
                    retired
                  </Label>
                )}
              </Stack>,
              <RowLink
                key="member"
                href={{ pathname: paths.dashboard.users.detail(review.member.id) }}
                secondary={review.member.email ?? undefined}
              >
                {review.member.name || review.member.id}
              </RowLink>,
              <ReviewDelete key="delete" id={review.id} />,
            ],
          }))}
          empty={query.q || query.rating ? 'Nothing matches those filters.' : 'Nobody has written a review yet.'}
        />
        <OffsetPager total={reviews.total} offset={reviews.offset} limit={reviews.limit} />
      </Panel>

      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Taking a review down recounts the item: `ratingAverage` and `ratingCount` are kept on the item so no list ever
        joins the reviews, and those are the figures every shop screen and every sort reads.
      </Typography>
    </Stack>
  );
}
