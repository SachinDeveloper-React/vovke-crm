import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { ActivityView } from '@/src/sections/staff/view';

export const metadata = { title: 'Activity log · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title="Activity log" subtitle="Every view, change, refusal and sign-in — who, as what, and when." />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return (
    <ActivityView
      query={{
        staffId: readString(params, 'staffId', ''),
        role: readEnum(params, 'role', ['', 'root', 'admin', 'manager', 'agent'] as const, ''),
        kind: readEnum(params, 'kind', ['', 'read', 'write', 'auth'] as const, ''),
        failed: readEnum(params, 'failed', ['', '1'] as const, ''),
        from: readString(params, 'from', ''),
        to: readString(params, 'to', ''),
        limit: readNumber(params, 'limit', 50, 1, 200),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
