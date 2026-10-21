import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readNumber, type SearchParams } from '@/src/lib/search-params';
import { DiagnoseView } from '@/src/sections/diagnose/view';

export const metadata = { title: 'Diagnose · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Diagnose"
        subtitle="Every install asked the same questions as one member — and the answers worst first."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return <DiagnoseView days={readNumber(params, 'days', 7, 1, 90)} />;
}
