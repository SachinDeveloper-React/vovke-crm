import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { FoodsView } from '@/src/sections/nutrition/foods-view';

export const metadata = { title: 'Food library · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Food library"
        subtitle="What every member searches, browses and quick-adds from. A spreadsheet goes in whole, matched by name."
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
    <FoodsView
      query={{
        q: readString(params, 'q'),
        cursor: readString(params, 'cursor'),
        limit: readNumber(params, 'limit', 50, 1, 200),
      }}
    />
  );
}
