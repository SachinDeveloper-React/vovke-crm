import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { CouponDetailView } from '@/src/sections/coupons/detail-view';

export const metadata = { title: 'Coupon · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ code: string }> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title="Coupon" subtitle="What it does, who has claimed it, and the orders that hold it." />
      <Suspense fallback={<PageSkeleton />}>
        <Loader params={params} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <CouponDetailView code={code} />;
}
