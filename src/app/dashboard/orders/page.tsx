import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { OrderQueueView } from '@/src/sections/orders/queue-view';

export const metadata = { title: 'Orders · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Orders"
        subtitle="What needs packing, what is stuck unpaid, and what was put right — in coins, money, or both."
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
    <OrderQueueView
      query={{
        q: readString(params, 'q'),
        status: readEnum(
          params,
          'status',
          ['', 'pending_payment', 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'] as const,
          '',
        ),
        paidWith: readEnum(params, 'paidWith', ['', 'coins', 'money', 'mixed'] as const, ''),
        sort: readEnum(params, 'sort', ['newest', 'oldest', 'biggest'] as const, 'newest'),
        limit: readNumber(params, 'limit', 25, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
