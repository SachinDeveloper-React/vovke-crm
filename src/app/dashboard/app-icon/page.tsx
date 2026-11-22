import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { AppIconView } from '@/src/sections/app-icon/view';

export const metadata = { title: 'App icon · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="App icon"
        subtitle="The icon on members' home screens: the everyday one, and festive ones by hand or on a schedule."
      />
      <Suspense fallback={<PageSkeleton />}>
        <AppIconView />
      </Suspense>
    </DashboardContent>
  );
}
