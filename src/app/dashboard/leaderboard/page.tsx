import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readString, type SearchParams } from '@/src/lib/search-params';
import { LeaderboardView } from '@/src/sections/leaderboard/view';

export const metadata = { title: 'Leaderboard · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Leaderboard"
        subtitle="What each place pays, who is standing in the paid places this week, and every word the app says about it — all of it written here, read by members without a release."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return <LeaderboardView query={{ country: readString(params, 'country') }} />;
}
