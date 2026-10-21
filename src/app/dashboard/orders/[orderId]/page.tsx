import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { OrderDetailView } from '@/src/sections/orders/detail-view';

export const metadata = { title: 'Order · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title="Order" subtitle="Every line, the address as it was, and its own history." />
      <Suspense fallback={<PageSkeleton />}>
        <Loader params={params} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderDetailView orderId={orderId} />;
}
