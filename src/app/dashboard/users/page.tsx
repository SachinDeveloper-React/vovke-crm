import { Suspense } from 'react';

import { PageHeader, PanelSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { UsersListView } from '@/src/sections/users/list-view';

export const metadata = { title: 'Members · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title="Members" subtitle="Find an account, then read everything the server knows about it." />
      <Suspense fallback={<PanelSkeleton height={420} />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return (
    <UsersListView
      query={{
        q: readString(params, 'q'),
        limit: readNumber(params, 'limit', 20, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
        tier: readEnum(params, 'tier', ['', 'trusted', 'normal', 'watch', 'restricted', 'banned'] as const, ''),
        platform: readEnum(params, 'platform', ['', 'ios', 'android'] as const, ''),
        status: readEnum(params, 'status', ['', 'frozen', 'deleted', 'unverified', 'deleting'] as const, ''),
        sort: readEnum(params, 'sort', ['newest', 'oldest', 'name', 'trust'] as const, 'newest'),
      }}
    />
  );
}
