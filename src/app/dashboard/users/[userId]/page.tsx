import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { readNumber, type SearchParams } from '@/src/lib/search-params';
import { MemberOverview } from '@/src/sections/users/overview-view';

export const metadata = { title: 'Member · Vokve Admin' };

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
  return <MemberOverview userId={userId} auditLimit={readNumber(query, 'audit', 20, 1, 200)} />;
}
