import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { DocumentsView } from '@/src/sections/website/documents-view';

export const metadata = { title: 'Documents · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Documents"
        subtitle="The Privacy Policy, the terms and every other policy on the website — each at its own address, with its own version and history."
      />
      <Suspense fallback={<PageSkeleton />}>
        <DocumentsView />
      </Suspense>
    </DashboardContent>
  );
}
