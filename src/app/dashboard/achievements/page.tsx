import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { AchievementsView } from '@/src/sections/gamification/achievements-view';

export const metadata = { title: 'Achievements · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Achievements"
        subtitle="The badge shelf: what each one stands for, what unlocks it, and who holds it. A badge is never taken back."
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
    <AchievementsView
      query={{
        q: readString(params, 'q'),
        state: readEnum(params, 'state', ['any', 'held', 'unheld', 'unreachable'] as const, 'any'),
        metric: readString(params, 'metric'),
        sort: readEnum(params, 'sort', ['shelf', 'newest', 'label'] as const, 'shelf'),
        limit: readNumber(params, 'limit', 25, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
