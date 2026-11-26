import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { PageEditorView } from '@/src/sections/website/editor-views';

export const metadata = { title: 'Website page · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ key: string }> }) {
  return (
    <DashboardContent maxWidth="xl">
      <Suspense fallback={<PageSkeleton />}>
        <Loader params={params} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <PageEditorView pageKey={key} />;
}
