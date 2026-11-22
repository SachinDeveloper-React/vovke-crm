import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { AccountView } from '@/src/sections/staff/view';

export const metadata = { title: 'My account · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="lg">
      <PageHeader title="My account" subtitle="Your password, where you are signed in, and what you have done." />
      <Suspense fallback={<PageSkeleton />}>
        <AccountView />
      </Suspense>
    </DashboardContent>
  );
}
