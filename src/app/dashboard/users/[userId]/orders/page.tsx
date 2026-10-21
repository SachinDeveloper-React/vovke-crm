import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { readEnum, readString, type SearchParams } from '@/src/lib/search-params';
import { MemberOrdersView } from '@/src/sections/users/orders-view';

export const metadata = { title: 'Orders · Vokve Admin' };

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Loader params={params} search={searchParams} />
    </Suspense>
  );
}

async function Loader({ params, search }: { params: Promise<{ userId: string }>; search: Promise<SearchParams> }) {
  const [{ userId }, query] = await Promise.all([params, search]);
  return (
    <MemberOrdersView
      userId={userId}
      status={readEnum(
        query,
        'status',
        ['', 'pending_payment', 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'] as const,
        '',
      )}
      cursor={readString(query, 'cursor')}
    />
  );
}
