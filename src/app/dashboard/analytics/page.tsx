import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readNumber, type SearchParams } from '@/src/lib/search-params';
import { AnalyticsView } from '@/src/sections/analytics/view';

export const metadata = { title: 'Analytics · Vokve Admin' };

/**
 * The title prerenders; the figures stream in behind the boundary.
 *
 * Nothing on this page can be cached — an operator's dashboard showing a
 * cached number is showing a wrong number — so the read is deliberately
 * inside `<Suspense>` rather than blocking the navigation.
 */
export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Analytics"
        subtitle="What grew, who used it, what they walked, and what it cost."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return <AnalyticsView days={readNumber(params, 'days', 30, 1, 365)} />;
}
