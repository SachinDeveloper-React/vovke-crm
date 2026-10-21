'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from '@/src/layout/paths';

/**
 * One account, fourteen questions.
 *
 * Tabs rather than one long page, and real routes rather than local state:
 * each answer is its own read, so opening a member does not pay for the trail
 * they may not look at — and every tab is a link that can be sent to whoever
 * has to act on it. The order is the order the questions come in: what they
 * did and what they hold first, then why the app is failing them, then the
 * case against them.
 */
export function MemberTabs({ userId }: { userId: string }) {
  const pathname = usePathname();
  const tabs = [
    { label: 'Overview', href: paths.dashboard.users.detail(userId) },
    { label: 'Steps & activity', href: paths.dashboard.users.steps(userId) },
    { label: 'Day timeline', href: paths.dashboard.users.timeline(userId) },
    { label: 'Coins', href: paths.dashboard.users.coins(userId) },
    { label: 'Badges', href: paths.dashboard.users.badges(userId) },
    { label: 'Orders', href: paths.dashboard.users.orders(userId) },
    { label: 'Basket & saved', href: paths.dashboard.users.basket(userId) },
    { label: 'Diagnosis', href: paths.dashboard.users.problems(userId) },
    { label: 'Installs', href: paths.dashboard.users.installs(userId) },
    { label: 'Health', href: paths.dashboard.users.health(userId) },
    { label: 'Trail', href: paths.dashboard.users.activity(userId) },
    { label: 'Sign-ins', href: paths.dashboard.users.logins(userId) },
    { label: 'Config & messages', href: paths.dashboard.users.config(userId) },
    { label: 'Fraud case', href: paths.dashboard.users.fraud(userId) },
  ];
  const current = tabs.reduce(
    (best, tab) => (pathname === tab.href || pathname.startsWith(`${tab.href}/`) ? tab.href : best),
    tabs[0].href as string,
  );

  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
      <Tabs value={current} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
        {tabs.map(tab => (
          <Tab key={tab.href} label={tab.label} value={tab.href} component={Link} href={{ pathname: tab.href }} />
        ))}
      </Tabs>
    </Box>
  );
}
