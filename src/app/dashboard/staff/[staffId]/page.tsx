import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { StaffDetailView } from '@/src/sections/staff/view';

export const metadata = { title: 'Staff member · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ staffId: string }> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title="Staff member" subtitle="Their access, what they can do, and what they have done." />
      <Suspense fallback={<PageSkeleton />}>
        <Loader params={params} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await params;
  return <StaffDetailView staffId={staffId} />;
}
