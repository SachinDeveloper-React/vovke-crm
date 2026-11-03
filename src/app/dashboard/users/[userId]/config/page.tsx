import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { MemberConfigView } from '@/src/sections/users/config-view';

export const metadata = { title: 'Config & messages · Vokve Admin' };

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
  return (
    <MemberConfigView
      userId={userId}
      query={{ limit: readNumber(query, 'limit', 25, 1, 100), cursor: readString(query, 'cursor') }}
    />
  );
}
