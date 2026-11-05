import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { readString, type SearchParams } from '@/src/lib/search-params';
import { MediaLibrary } from '@/src/sections/media/view';

export const metadata = { title: 'Images · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Loader search={searchParams} />
    </Suspense>
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
