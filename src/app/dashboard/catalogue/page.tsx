import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { CatalogueView } from '@/src/sections/catalogue/view';

export const metadata = { title: 'Catalogue · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Catalogue"
        subtitle="What is on the shelf, what it costs, and whether it is bought with coins, money, or both."
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
    <CatalogueView
      query={{
        q: readString(params, 'q'),
        // A slug, not a fixed list: the shelves are rows an operator
        // writes, and an unknown one asks the API for an empty shelf
        // rather than a 400.
        category: readString(params, 'category').slice(0, 40),
        paymentMode: readEnum(params, 'paymentMode', ['', 'coins', 'money', 'mixed', 'shop'] as const, ''),
        state: readEnum(params, 'state', ['any', 'active', 'retired', 'out_of_stock', 'low_stock'] as const, 'any'),
        sort: readEnum(params, 'sort', ['sort', 'newest', 'price_asc', 'price_desc', 'popular', 'title'] as const, 'sort'),
        limit: readNumber(params, 'limit', 25, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
