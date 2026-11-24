import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { ContactView } from '@/src/sections/contact/view';

export const metadata = { title: 'Contact & links · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Contact & links"
        subtitle="The support email and numbers, the company's address, and every link the app and the website open — changed here, live everywhere."
      />
      <Suspense fallback={<PageSkeleton />}>
        <ContactView />
      </Suspense>
    </DashboardContent>
  );
}
