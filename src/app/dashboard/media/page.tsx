import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readString, type SearchParams } from '@/src/lib/search-params';
import { MediaLibrary } from '@/src/sections/media/view';

export const metadata = { title: 'Images · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    // The container is what gives every dashboard page its side padding;
    // without it the library ran edge to edge against the nav and the window.
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Images"
        subtitle="Upload a picture once, then put it on a product by hand or name it in a spreadsheet's images column."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const query = await search;
  return (
    <MediaLibrary
      kind={readString(query, 'kind') || undefined}
      q={readString(query, 'q') || undefined}
    />
  );
}
