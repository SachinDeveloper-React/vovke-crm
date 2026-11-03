import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { ChallengesView } from '@/src/sections/gamification/challenges-view';

export const metadata = { title: 'Challenges · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Challenges"
        subtitle="What each one asks for, what it pays, and what it has actually paid. Every member is enrolled in every open challenge."
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
    <ChallengesView
      query={{
        q: readString(params, 'q'),
        state: readEnum(params, 'state', ['any', 'live', 'upcoming', 'ended', 'retired'] as const, 'any'),
        cadence: readEnum(params, 'cadence', ['', 'daily', 'weekly', 'monthly'] as const, ''),
        sort: readEnum(params, 'sort', ['shelf', 'newest', 'title'] as const, 'shelf'),
        limit: readNumber(params, 'limit', 25, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
