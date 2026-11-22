'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Me = {
  kind: 'staff' | 'root';
  id: string;
  name: string;
  email: string | null;
  role: 'root' | 'admin' | 'manager' | 'agent';
  manager: { id: string; name: string } | null;
  effectivePermissions: string[];
};

type StaffContextValue = {
  me: Me | null;
  loading: boolean;
  /** Whether the signed-in person holds the permission (or any of several). */
  can: (permission?: string | readonly string[] | null) => boolean;
};

const StaffContext = createContext<StaffContextValue>({ me: null, loading: true, can: () => false });

/**
 * Who is signed in, for drawing only (RULES Z9): the sidebar hides what this
 * person cannot open, and buttons can hide what they cannot do. Hiding is a
 * courtesy — the API refuses the call either way, so nothing here is a
 * security boundary.
 */
export function StaffProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/me', { cache: 'no-store', credentials: 'same-origin' })
      .then(response => (response.ok ? (response.json() as Promise<Me>) : null))
      .then(value => {
        if (alive) setMe(value);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<StaffContextValue>(() => {
    const held = new Set(me?.effectivePermissions ?? []);
    return {
      me,
      loading,
      can: permission => {
        if (!permission) return true;
        if (!me) return false;
        if (me.kind === 'root' || me.role === 'admin') return true;
        const list = typeof permission === 'string' ? [permission] : permission;
        return list.some(p => held.has(p));
      },
    };
  }, [me, loading]);

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff() {
  return useContext(StaffContext);
}

/** Renders its children only for somebody who holds the permission. */
export function Can({ permission, children, fallback = null }: { permission: string | readonly string[]; children: ReactNode; fallback?: ReactNode }) {
  const { can, loading } = useStaff();
  if (loading) return null;
  return <>{can(permission) ? children : fallback}</>;
}
