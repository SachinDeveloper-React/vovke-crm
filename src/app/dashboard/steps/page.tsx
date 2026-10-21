import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { StepsConfigPage } from '@/src/sections/steps/view';

export const metadata = { title: 'Steps config · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Steps config"
        subtitle="What the phone is told to count, when it must have reported by, what the layers refuse, and what a verified day is worth."
      />
      <Suspense fallback={<PageSkeleton />}>
        <StepsConfigPage />
      </Suspense>
    </DashboardContent>
  );
}
