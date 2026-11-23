'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import Tooltip from '@mui/material/Tooltip';

import { Iconify } from '@/src/components/iconify/iconify';
import { LinkButton } from '@/src/components/ui/nav';
import type { MaintenanceFlag } from '@/src/lib/types';

/** Fired when the Maintenance page renders a different state, so the header does not wait for the next page. */
const MAINTENANCE_CHANGED = 'vokve:maintenance-changed';

/**
 * Rendered by the Maintenance page with the state it just drew. The switch
 * re-renders that page (and takes the form that pressed it away with it),
 * so the page itself is what tells the header to ask again.
 */
export function MaintenanceSync({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    window.dispatchEvent(new Event(MAINTENANCE_CHANGED));
  }, [enabled]);
  return null;
}

/**
 * A red "Maintenance on" in the header of every page while members are
 * kept out (RULES DV14).
 *
 * Maintenance is the one switch whose cost grows every minute it is
 * forgotten, and the person who turned it on is rarely the one looking at
 * the panel an hour later. So it is said everywhere, to everybody signed in,
 * and links to where it is turned off.
 */
export function MaintenanceFlagButton() {
  const pathname = usePathname();
  const [flag, setFlag] = useState<MaintenanceFlag | null>(null);
  const [asked, setAsked] = useState(0);

  useEffect(() => {
    const again = () => setAsked(count => count + 1);
    window.addEventListener(MAINTENANCE_CHANGED, again);
    return () => window.removeEventListener(MAINTENANCE_CHANGED, again);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/maintenance', { cache: 'no-store', credentials: 'same-origin' })
      .then(response =>
        response.ok && (response.headers.get('content-type') ?? '').includes('json')
          ? (response.json() as Promise<MaintenanceFlag>)
          : null,
      )
      .then(value => {
        if (alive) setFlag(value);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname, asked]);

  if (!flag?.enabled) return null;

  const since = flag.startedAt ? new Date(flag.startedAt).toLocaleString() : null;
  return (
    <Tooltip title={`Members see the maintenance screen${since ? ` — on since ${since}` : ''}. Testers and staff carry on.`}>
      <span>
        <LinkButton
          href="/dashboard/maintenance"
          size="small"
          variant="contained"
          color="error"
          startIcon={<Iconify icon="solar:shield-warning-bold-duotone" />}
        >
          Maintenance on
        </LinkButton>
      </span>
    </Tooltip>
  );
}
