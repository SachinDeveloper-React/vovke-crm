import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { AutomationsView } from '@/src/sections/automations/view';

export const metadata = { title: 'Automations · Vokve Admin' };

export default function Page() {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Automations"
        subtitle="What the app tells members on its own — morning motivation, check-ins, the weekly summary, update notices, tips, saved rewards now affordable — and the messages you schedule. Each at the member's own hour, never more than the daily cap."
      />
      <Suspense fallback={<PageSkeleton />}>
        <AutomationsView />
      </Suspense>
    </DashboardContent>
  );
}
