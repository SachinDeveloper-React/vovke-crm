import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { BasketsView } from '@/src/sections/baskets/view';

export const metadata = { title: 'Baskets · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Baskets"
        subtitle="What nobody checked out, which of those cannot check out, and what people want that is not on the shelf."
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
    <BasketsView
      query={{
        q: readString(params, 'q'),
        state: readEnum(params, 'state', ['any', 'blocked', 'with_coupon', 'stale', 'fresh'] as const, 'any'),
        staleDays: readNumber(params, 'staleDays', 7, 1, 365),
        sort: readEnum(params, 'sort', ['updated', 'value', 'units', 'oldest'] as const, 'updated'),
        limit: readNumber(params, 'limit', 25, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
