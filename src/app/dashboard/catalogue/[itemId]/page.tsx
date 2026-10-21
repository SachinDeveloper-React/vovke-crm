import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { ProductDetailView } from '@/src/sections/catalogue/detail-view';

export const metadata = { title: 'Product · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ itemId: string }> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Product"
        subtitle="Every field, what it has sold, who is waiting for it, what members said, and who changed it last."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader params={params} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return <ProductDetailView itemId={itemId} />;
}
