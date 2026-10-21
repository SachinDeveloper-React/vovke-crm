import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { NotificationsView } from '@/src/sections/system/notifications-view';

export const metadata = { title: 'Notifications · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Notifications"
        subtitle="What the app has told everybody, where each message went, and whether anybody read it."
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
    <NotificationsView
      query={{
        q: readString(params, 'q'),
        topic: readEnum(
          params,
          'topic',
          ['', 'steps', 'workout', 'streak', 'hydration', 'coins', 'challenge', 'reward', 'health', 'system'] as const,
          '',
        ),
        state: readEnum(params, 'state', ['any', 'read', 'unread', 'pushed', 'deferred', 'not_pushed'] as const, 'any'),
        days: readNumber(params, 'days', 7, 1, 365),
        limit: readNumber(params, 'limit', 25, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
