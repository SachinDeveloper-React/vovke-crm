import { Suspense } from 'react';

import { PageSkeleton } from '@/src/components/ui';
import { MemberBasketView } from '@/src/sections/users/basket-view';

export const metadata = { title: 'Basket · Vokve Admin' };

export default function Page({ params }: { params: Promise<{ userId: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <MemberBasketView userId={userId} />;
}
