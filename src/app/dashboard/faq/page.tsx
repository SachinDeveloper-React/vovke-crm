import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { HelpView } from '@/src/sections/system/help-view';

export const metadata = { title: 'Help centre · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Help centre"
        subtitle="The articles members search and the guide they follow — written here, read by them without an app release."
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
    <HelpView
      query={{
        q: readString(params, 'q'),
        category: readEnum(
          params,
          'category',
          ['', 'account', 'coins', 'orders', 'tracking', 'payments', 'privacy', 'other'] as const,
          '',
        ),
        state: readEnum(params, 'state', ['any', 'active', 'hidden'] as const, 'any'),
        sort: readEnum(params, 'sort', ['shelf', 'newest', 'question'] as const, 'shelf'),
        limit: readNumber(params, 'limit', 50, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
