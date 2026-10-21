import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { MemberBadgesView } from '@/src/sections/users/badges-view';

export const metadata = { title: 'Badges · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ userId: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <MemberBadgesView userId={userId} />;
}
