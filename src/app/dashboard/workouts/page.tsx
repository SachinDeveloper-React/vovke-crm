import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { TrainingView } from '@/src/sections/training/view';

export const metadata = { title: 'Workouts · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Workouts"
        subtitle="The exercise list, and the templates built from it. Both are read live by the app; a finished workout keeps its own copy."
      />
      <Suspense fallback={<PageSkeleton />}>
        <TrainingView />
      </Suspense>
    </DashboardContent>
  );
}
