import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { ADMIN_TIMEZONE } from '@/src/lib/api';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { MemberTimelineView } from '@/src/sections/users/timeline-view';

export const metadata = { title: 'Day timeline · Vokve Admin' };

/** Today in the zone the panel buckets every day by (D-18). */
function today(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ADMIN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

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
  const asked = readString(query, 'date');
  return (
    <MemberTimelineView
      userId={userId}
      date={/^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : today()}
      overlapsOnly={readEnum(query, 'overlaps', ['all', 'only'] as const, 'all') === 'only'}
      offset={readNumber(query, 'offset', 0, 0, 1440)}
      limit={readNumber(query, 'limit', 100, 50, 500)}
      view={readEnum(query, 'view', ['runs', 'minutes'] as const, 'runs')}
    />
  );
}
