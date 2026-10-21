import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { readNumber, type SearchParams } from '@/src/lib/search-params';
import { MemberHealth } from '@/src/sections/users/health-view';

export const metadata = { title: 'Health · Vokve Admin' };

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

async function Loader({
  params,
  search,
}: {
  params: Promise<{ userId: string }>;
  search: Promise<SearchParams>;
}) {
  const [{ userId }, query] = await Promise.all([params, search]);
  return <MemberHealth userId={userId} errors={readNumber(query, 'errors', 25, 1, 100)} />;
}
