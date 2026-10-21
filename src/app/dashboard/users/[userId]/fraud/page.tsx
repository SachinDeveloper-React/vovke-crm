import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { readNumber, type SearchParams } from '@/src/lib/search-params';
import { FraudCaseView } from '@/src/sections/fraud/case-view';

export const metadata = { title: 'Fraud case · Vokve Admin' };

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
  return <FraudCaseView userId={userId} days={readNumber(query, 'days', 30, 1, 365)} />;
}
