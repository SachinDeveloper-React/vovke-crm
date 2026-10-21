import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readString, type SearchParams } from '@/src/lib/search-params';
import { ConfigView } from '@/src/sections/system/config-view';

export const metadata = { title: 'App config · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="App config"
        subtitle="Every knob the server holds, section by section — what is in force, what the code ships, and the way back."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return <ConfigView query={{ q: readString(params, 'q'), section: readString(params, 'section') }} />;
}
