import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readString, type SearchParams } from '@/src/lib/search-params';
import { MessagesView } from '@/src/sections/messages/view';

export const metadata = { title: 'Messages · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Messages"
        subtitle="Telling a segment something — the count first, then the words, and nothing that can be taken back."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return (
    <MessagesView
      segment={{
        tier: readEnum(params, 'tier', ['', 'trusted', 'normal', 'watch', 'restricted', 'banned'] as const, ''),
        platform: readEnum(params, 'platform', ['', 'ios', 'android'] as const, ''),
        seenWithinDays: readEnum(params, 'seenWithinDays', ['', '1', '7', '30', '90'] as const, ''),
        notSeenForDays: readEnum(params, 'notSeenForDays', ['', '7', '14', '30', '90'] as const, ''),
        pushableOnly: readString(params, 'pushableOnly') === 'true',
      }}
    />
  );
}
