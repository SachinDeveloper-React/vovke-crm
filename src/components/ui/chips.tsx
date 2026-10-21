import { Label } from '@/src/components/label';
import { Iconify } from '@/src/components/iconify/iconify';
import type { PermissionState, Severity } from '@/src/lib/types';
import { humanise } from '@/src/lib/format';

/**
 * A severity, as a chip that says the word.
 *
 * The color is the reserved status channel, never a series hue, and the text
 * is always there beside it: a red pill with no word in it makes a
 * colorblind reader guess, and a printout makes everyone guess.
 */
export function SeverityChip({ severity }: { severity: Severity }) {
  const map = {
    high: { color: 'error', icon: 'solar:danger-triangle-bold' },
    medium: { color: 'warning', icon: 'solar:info-circle-bold' },
    low: { color: 'default', icon: 'solar:minus-circle-bold' },
  } as const;
  const { color, icon } = map[severity];
  return (
    <Label color={color} variant="soft" startIcon={<Iconify icon={icon} />}>
      {severity}
    </Label>
  );
}

/** What the OS allows, in the app's own words (RULES P14). */
export function PermissionChip({ state, label }: { state: PermissionState; label?: string }) {
  const map: Record<PermissionState, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
    granted: 'success',
    denied: 'warning',
    // Blocked cannot be asked for in-app again — that is worse than denied.
    blocked: 'error',
    unavailable: 'default',
    unknown: 'default',
  };
  return (
    <Label color={map[state]} variant="soft">
      {label ? `${label}: ${state}` : state}
    </Label>
  );
}

export function BoolChip({
  value,
  yes = 'yes',
  no = 'no',
  goodWhen = true,
}: {
  value: boolean | null | undefined;
  yes?: string;
  no?: string;
  goodWhen?: boolean;
}) {
  if (value === null || value === undefined) {
    return (
      <Label color="default" variant="soft">
        unknown
      </Label>
    );
  }
  const good = value === goodWhen;
  return (
    <Label color={good ? 'success' : 'error'} variant="soft">
      {value ? yes : no}
    </Label>
  );
}

/** A release's standing, and the wall it is on the wrong side of (RULES DV12). */
export function ReleaseStatusChip({ status }: { status: 'current' | 'supported' | 'deprecated' | 'blocked' }) {
  const map = { current: 'success', supported: 'info', deprecated: 'warning', blocked: 'error' } as const;
  return (
    <Label color={map[status]} variant="soft">
      {status}
    </Label>
  );
}

export function FlagStatusChip({ status }: { status: 'open' | 'confirmed' | 'dismissed' }) {
  const map = { open: 'warning', confirmed: 'error', dismissed: 'default' } as const;
  return (
    <Label color={map[status]} variant="soft">
      {status}
    </Label>
  );
}

export function TrustChip({ tier, score }: { tier: string | null; score: number | null }) {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
    trusted: 'success',
    normal: 'info',
    watch: 'warning',
    restricted: 'error',
  };
  return (
    <Label color={map[tier ?? ''] ?? 'default'} variant="soft">
      {tier ?? 'unknown'}
      {score === null ? '' : ` · ${score}`}
    </Label>
  );
}

/** An order's state, as the till left it. */
export function OrderStatusChip({ status }: { status: string }) {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
    placed: 'info',
    paid: 'success',
    packed: 'info',
    shipped: 'info',
    delivered: 'success',
    cancelled: 'error',
    refunded: 'warning',
    payment_pending: 'warning',
    payment_failed: 'error',
  };
  return (
    <Label color={map[status] ?? 'default'} variant="soft">
      {humanise(status)}
    </Label>
  );
}
