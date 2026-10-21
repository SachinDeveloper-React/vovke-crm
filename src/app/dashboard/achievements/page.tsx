import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { AchievementsView } from '@/src/sections/gamification/achievements-view';

export const metadata = { title: 'Achievements · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Achievements"
        subtitle="The badge shelf: what each one stands for, what unlocks it, and who holds it. A badge is never taken back."
      />
      <Suspense fallback={<PageSkeleton />}>
        <AchievementsView />
      </Suspense>
    </DashboardContent>
  );
}
