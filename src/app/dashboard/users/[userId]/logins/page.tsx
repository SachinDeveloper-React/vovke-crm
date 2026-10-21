import { Suspense } from 'react';

import { PanelSkeleton } from '@/src/components/ui';
import { readNumber, type SearchParams } from '@/src/lib/search-params';
import { MemberLogins } from '@/src/sections/users/logins-view';

export const metadata = { title: 'Sign-ins · Vokve Admin' };

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<PanelSkeleton height={360} />}>
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
  return <MemberLogins userId={userId} limit={readNumber(query, 'limit', 50, 1, 200)} />;
}
