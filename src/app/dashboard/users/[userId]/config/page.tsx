import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { MemberConfigView } from '@/src/sections/users/config-view';

export const metadata = { title: 'Config & messages · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ userId: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <MemberConfigView userId={userId} />;
}
