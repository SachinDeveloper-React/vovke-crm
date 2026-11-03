import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, type SearchParams } from '@/src/lib/search-params';
import { ReleasesView } from '@/src/sections/releases/view';

export const metadata = { title: 'Releases · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Releases"
        subtitle="Telling the app about a build is a knock. Raising the minimum is a wall — two decisions, kept apart on purpose."
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
    <ReleasesView
      query={{
        platform: readEnum(params, 'platform', ['', 'ios', 'android'] as const, ''),
        status: readEnum(
          params,
          'status',
          ['any', 'current', 'supported', 'deprecated', 'blocked'] as const,
          'any',
        ),
        limit: readNumber(params, 'limit', 25, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
