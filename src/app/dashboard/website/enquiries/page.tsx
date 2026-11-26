import { Suspense } from 'react';

import { PageHeader, PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { readEnum, readNumber, readString, type SearchParams } from '@/src/lib/search-params';
import { ENQUIRY_FILTERS, EnquiriesView } from '@/src/sections/website/enquiries-view';

export const metadata = { title: 'Enquiries · Vokve Admin' };

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Enquiries"
        subtitle="Messages sent from the website’s contact form — from members and from people who are not members yet."
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
    <EnquiriesView
      query={{
        status: readEnum(params, 'status', ENQUIRY_FILTERS, 'waiting'),
        q: readString(params, 'q'),
        limit: readNumber(params, 'limit', 30, 1, 100),
        offset: readNumber(params, 'offset', 0, 0, 100_000),
      }}
    />
  );
}
