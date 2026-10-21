import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { readEnum, readString, type SearchParams } from '@/src/lib/search-params';
import { MemberCoinsView } from '@/src/sections/users/coins-view';

export const metadata = { title: 'Coins · Vokve Admin' };

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
    <MemberCoinsView
      userId={userId}
      direction={readEnum(query, 'direction', ['any', 'in', 'out'] as const, 'any')}
      source={readEnum(
        query,
        'source',
        ['', 'steps', 'workout', 'streak', 'challenge', 'referral', 'purchase', 'refund'] as const,
        '',
      )}
      cursor={readString(query, 'cursor')}
    />
  );
}
