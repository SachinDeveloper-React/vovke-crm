import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readNumber, type SearchParams } from '@/src/lib/search-params';
import { EconomyView } from '@/src/sections/economy/view';

export const metadata = { title: 'Step economy · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Step economy"
        subtitle="What switching step coins on would have cost, and how much of what members walked the layers actually verified."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return <EconomyView days={readNumber(params, 'days', 30, 1, 90)} />;
}
