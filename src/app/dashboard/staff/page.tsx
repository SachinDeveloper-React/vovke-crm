import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { StaffListView } from '@/src/sections/staff/view';

export const metadata = { title: 'Staff · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title="Staff" subtitle="Admins, managers and agents — who can sign in, and what each of them may do." />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return (
    <StaffListView
      query={{
        q: readString(params, 'q', ''),
        role: readEnum(params, 'role', ['', 'admin', 'manager', 'agent'] as const, ''),
        status: readEnum(params, 'status', ['any', 'active', 'suspended'] as const, 'any'),
        limit: readNumber(params, 'limit', 50, 1, 200),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
