import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { DashboardContent } from '@/src/layout/dashboard/main';
import { MemberHeader, MemberHeaderSkeleton } from '@/src/sections/users/member-header';

/**
 * The member's own frame: who they are and the tabs, above whichever answer
 * is being read.
 *
 * The header is its own boundary, so a slow tab does not hold up the name at
 * the top — and a tab's own fallback covers only the tab.
 */
export default function Layout({
  params,
  children,
}: {
  params: Promise<{ userId: string }>;
  children: ReactNode;
}) {
  return (
    <DashboardContent maxWidth="xl">
      <Suspense fallback={<MemberHeaderSkeleton />}>
        <MemberHeader params={params} />
      </Suspense>
      {children}
    </DashboardContent>
  );
}
