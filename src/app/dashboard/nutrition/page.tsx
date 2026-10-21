import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { NutritionView } from '@/src/sections/nutrition/overview-view';

export const metadata = { title: 'Nutrition · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Nutrition"
        subtitle="The targets a member starts with, what they are eating by, and where the library and the plans live."
      />
      <Suspense fallback={<PageSkeleton />}>
        <NutritionView />
      </Suspense>
    </DashboardContent>
  );
}
