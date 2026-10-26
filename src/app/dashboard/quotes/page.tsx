import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { QuotesView } from '@/src/sections/content/quotes-view';

export const metadata = { title: 'Quotes & tips · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Quotes & tips"
        subtitle="Every line the app says in its own voice — the home screen's quote, the tips beside the water log and the vitals. One per screen per day, in rotation, changed here without an app release."
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
    <QuotesView
      query={{
        q: readString(params, 'q'),
        topic: readEnum(
          params,
          'topic',
          [
            '',
            'motivation',
            'hydration',
            'reminders',
            'nutrition',
            'health',
            'heart_rate',
            'blood_pressure',
          ] as const,
          '',
        ),
        state: readEnum(params, 'state', ['any', 'active', 'hidden'] as const, 'any'),
        sort: readEnum(params, 'sort', ['rotation', 'newest', 'text'] as const, 'rotation'),
        limit: readNumber(params, 'limit', 100, 1, 200),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
