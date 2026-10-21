import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { CouponsView } from '@/src/sections/coupons/view';

export const metadata = { title: 'Coupons · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Coupons"
        subtitle="Campaigns, the limits that decide what each one costs, and what they have actually given away."
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
    <CouponsView
      query={{
        q: readString(params, 'q'),
        state: readEnum(
          params,
          'state',
          ['any', 'live', 'scheduled', 'expired', 'exhausted', 'inactive'] as const,
          'any',
        ),
        kind: readEnum(params, 'kind', ['', 'percent', 'flat'] as const, ''),
        sort: readEnum(params, 'sort', ['newest', 'code', 'redemptions', 'value', 'ending'] as const, 'newest'),
        limit: readNumber(params, 'limit', 25, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
