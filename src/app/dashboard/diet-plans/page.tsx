import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { DietPlansView } from '@/src/sections/nutrition/plans-view';

export const metadata = { title: 'Diet plans · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Diet plans"
        subtitle="Programmes of days a member either picks by name or is given. Days run in rotation."
      />
      <Suspense fallback={<PageSkeleton />}>
        <DietPlansView />
      </Suspense>
    </DashboardContent>
  );
}
