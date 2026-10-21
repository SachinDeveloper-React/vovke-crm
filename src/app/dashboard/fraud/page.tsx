import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, type SearchParams } from '@/src/lib/search-params';
import { FraudQueueView } from '@/src/sections/fraud/queue-view';

export const metadata = { title: 'Fraud queue · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Fraud queue"
        subtitle="The layers have been flagging days since the first snapshot. A detection nobody sees is a detection that does not exist."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Loader search={searchParams} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ search }: { search: Promise<SearchParams> }) {
  const params = await search;
  return (
    <FraudQueueView
      status={readEnum(params, 'status', ['open', 'confirmed', 'dismissed', 'any'] as const, 'open')}
      severity={readEnum(params, 'severity', ['any', 'hard', 'soft'] as const, 'any')}
      days={readNumber(params, 'days', 30, 1, 365)}
      limit={readNumber(params, 'limit', 25, 1, 200)}
    />
  );
}
