import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { ReleasesView } from '@/src/sections/releases/view';

export const metadata = { title: 'Releases · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Releases"
        subtitle="Telling the app about a build is a knock. Raising the minimum is a wall — two decisions, kept apart on purpose."
      />
      <Suspense fallback={<PageSkeleton />}>
        <ReleasesView />
      </Suspense>
    </DashboardContent>
  );
}
