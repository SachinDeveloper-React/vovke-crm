import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { SupportView } from '@/src/sections/system/support-view';

export const metadata = { title: 'Support · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Support"
        subtitle="Who is waiting for an answer, longest wait first — and what they are all asking about."
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
    <SupportView
      query={{
        q: readString(params, 'q'),
        status: readEnum(params, 'status', ['any', 'open', 'in_progress', 'resolved', 'closed'] as const, 'any'),
        category: readEnum(
          params,
          'category',
          ['', 'account', 'coins', 'orders', 'tracking', 'payments', 'privacy', 'other'] as const,
          '',
        ),
        waiting: readEnum(params, 'waiting', ['any', 'us', 'them'] as const, 'any'),
        sort: readEnum(params, 'sort', ['waiting', 'updated', 'newest', 'oldest'] as const, 'waiting'),
        limit: readNumber(params, 'limit', 25, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
