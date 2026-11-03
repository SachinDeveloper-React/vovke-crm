import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { readEnum, readNumber, type SearchParams } from '@/src/lib/search-params';
import { MemberBadgesView } from '@/src/sections/users/badges-view';

export const metadata = { title: 'Badges · Vokve Admin' };

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
    <MemberBadgesView
      userId={userId}
      query={{
        state: readEnum(query, 'state', ['any', 'held', 'unheld'] as const, 'any'),
        limit: readNumber(query, 'limit', 24, 1, 100),
        offset: readNumber(query, 'offset', 0, 0, 100_000),
        challengeLimit: readNumber(query, 'challengeLimit', 25, 1, 100),
        challengeOffset: readNumber(query, 'challengeOffset', 0, 0, 100_000),
      }}
    />
  );
}
