import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { ReviewsView } from '@/src/sections/reviews/view';

export const metadata = { title: 'Reviews · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Reviews"
        subtitle="What members wrote on the product pages, worst first — a product problem to fix, or a review to take down."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return (
    <ReviewsView
      query={{
        q: readString(params, 'q'),
        itemId: readString(params, 'itemId'),
        rating: readEnum(params, 'rating', ['', '1', '2', '3', '4', '5'] as const, ''),
        verified: readEnum(params, 'verified', ['any', 'yes', 'no'] as const, 'any'),
        sort: readEnum(params, 'sort', ['lowest', 'newest', 'oldest', 'highest'] as const, 'lowest'),
        limit: readNumber(params, 'limit', 25, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
