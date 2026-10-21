import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { TicketView } from '@/src/sections/system/ticket-view';

export const metadata = { title: 'Ticket · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ ticketId: string }> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader title="Ticket" subtitle="The whole conversation, the phone it was opened from, and the reply." />
      <Suspense fallback={<PageSkeleton />}>
        <Loader params={params} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <TicketView ticketId={ticketId} />;
}
