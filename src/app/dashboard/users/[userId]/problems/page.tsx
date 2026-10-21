import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { MemberProblems } from '@/src/sections/users/problems-view';

export const metadata = { title: 'Diagnosis · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ userId: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <MemberProblems userId={userId} />;
}
