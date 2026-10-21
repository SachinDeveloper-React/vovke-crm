import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { ChallengesView } from '@/src/sections/gamification/challenges-view';

export const metadata = { title: 'Challenges · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Challenges"
        subtitle="What each one asks for, what it pays, and what it has actually paid. Every member is enrolled in every open challenge."
      />
      <Suspense fallback={<PageSkeleton />}>
        <ChallengesView />
      </Suspense>
    </DashboardContent>
  );
}
