import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { ReferralCardsView } from '@/src/sections/content/referral-cards-view';

export const metadata = { title: 'Invite cards · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Invite cards"
        subtitle="The refer-a-friend card the app draws on every screen that earns coins. The heading, the pitch, the button, the colour and which screens carry it at all — all changed here, without an app release. The reward itself comes from what the economy is paying."
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
    <ReferralCardsView
      query={{
        q: readString(params, 'q'),
        screen: readEnum(
          params,
          'screen',
          [
            '',
            'home',
            'wallet',
            'shop',
            'challenges',
            'nutrition',
            'health',
            'hydration',
            'streak',
            'analytics',
            'account',
          ] as const,
          '',
        ),
        state: readEnum(params, 'state', ['any', 'active', 'hidden'] as const, 'any'),
        sort: readEnum(params, 'sort', ['rotation', 'newest', 'title'] as const, 'rotation'),
        limit: readNumber(params, 'limit', 100, 1, 200),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
