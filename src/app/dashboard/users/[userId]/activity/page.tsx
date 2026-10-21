import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { MemberTrail } from '@/src/sections/users/trail-view';

export const metadata = { title: 'Trail · Vokve Admin' };

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
    <MemberTrail
      userId={userId}
      days={readNumber(query, 'days', 30, 1, 90)}
      limit={readNumber(query, 'limit', 50, 1, 200)}
      cursor={readString(query, 'cursor')}
      name={readString(query, 'name')}
      screen={readString(query, 'screen')}
    />
  );
}
