import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { DietPlansView } from '@/src/sections/nutrition/plans-view';

export const metadata = { title: 'Diet plans · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Diet plans"
        subtitle="Programmes of days a member either picks by name or is given. Days run in rotation."
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
    <DietPlansView
      query={{
        q: readString(params, 'q'),
        state: readEnum(params, 'state', ['any', 'active', 'retired'] as const, 'any'),
        sort: readEnum(params, 'sort', ['shelf', 'newest', 'name'] as const, 'shelf'),
        // Ten, not twenty-five: a plan carries every meal of every day of
        // itself, so this is the heaviest row on the panel.
        limit: readNumber(params, 'limit', 10, 1, 50),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
