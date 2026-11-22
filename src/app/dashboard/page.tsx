import { Suspense } from 'react';

import { redirect } from 'next/navigation';

import { currentStaff } from '@/src/lib/api';
import { navData, visibleNav } from '@/src/layout/config-nav-dashboard';
import { paths } from '@/src/layout/paths';

/**
 * Where signing in lands: the first page in the menu this person may open
 * (RULES Z9). Analytics for an admin; the support queue for a support
 * agent who cannot read analytics — rather than a "no permission" page as
 * the first thing they see.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Landing />
    </Suspense>
  );
}

async function Landing() {
  const me = await currentStaff();
  if (!me) redirect('/auth/sign-in?from=expired');
  if (me.setup.changePassword || me.setup.enrollTotp) redirect('/auth/setup');
  const held = new Set(me.effectivePermissions);
  const can = (permission?: string | readonly string[] | null) =>
    !permission || me.kind === 'root' || me.role === 'admin' || (typeof permission === 'string' ? [permission] : permission).some(p => held.has(p));
  const first = visibleNav(navData, can)
    .flatMap(group => group.items)
    .find(item => item.path !== paths.dashboard.guide);
  redirect((first?.path ?? paths.dashboard.account) as typeof paths.dashboard.account);
  return null;
}
