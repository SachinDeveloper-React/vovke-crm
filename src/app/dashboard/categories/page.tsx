import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { CategoriesView } from '@/src/sections/catalogue/categories-view';

export const metadata = { title: 'Categories · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Categories"
        subtitle="What each shelf is carrying, the free text filed under it, and the two writes that move items between them."
      />
      <Suspense fallback={<PageSkeleton />}>
        <CategoriesView />
      </Suspense>
    </DashboardContent>
  );
}
