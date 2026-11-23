import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { MaintenanceView } from '@/src/sections/maintenance/view';

export const metadata = { title: 'Maintenance · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Maintenance"
        subtitle="Take the app down for members while the team works on it. Testers and staff keep using it, with a strip that says maintenance is on."
      />
      <Suspense fallback={<PageSkeleton />}>
        <MaintenanceView />
      </Suspense>
    </DashboardContent>
  );
}
