import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { MemberInstalls } from '@/src/sections/users/installs-view';

export const metadata = { title: 'Installs · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ userId: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <MemberInstalls userId={userId} />;
}
