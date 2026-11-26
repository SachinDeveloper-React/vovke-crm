import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { DashboardContent } from '@/src/layout/dashboard/main';
import { DocumentEditorView } from '@/src/sections/website/editor-views';

export const metadata = { title: 'Document · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <DashboardContent maxWidth="xl">
      <Suspense fallback={<PageSkeleton />}>
        <Loader params={params} />
      </Suspense>
    </DashboardContent>
  );
}

async function Loader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DocumentEditorView slug={slug} />;
}
