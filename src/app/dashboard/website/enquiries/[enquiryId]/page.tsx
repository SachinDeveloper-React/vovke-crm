import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { EnquiryView } from '@/src/sections/website/enquiry-view';

export const metadata = { title: 'Enquiry · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ enquiryId: string }> }) {
  return (
    <DashboardContent maxWidth="xl">
      <Suspense fallback={<PageSkeleton />}>
        <Loader params={params} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ params }: { params: Promise<{ enquiryId: string }> }) {
  const { enquiryId } = await params;
  return <EnquiryView id={enquiryId} />;
}
