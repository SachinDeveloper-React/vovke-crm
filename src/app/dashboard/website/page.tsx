import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { WebsiteOverviewView } from '@/src/sections/website/overview-view';

export const metadata = { title: 'Website · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Website"
        subtitle="Every word on vokve.com — the home page, About, FAQ, Contact, the policies — edited here and live on the site when you save."
      />
      <Suspense fallback={<PageSkeleton />}>
        <WebsiteOverviewView />
      </Suspense>
    </DashboardContent>
  );
}
