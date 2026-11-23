import { adminTry } from '@/src/lib/api';
import type { MaintenanceFlag } from '@/src/lib/types';

/**
 * Whether maintenance is on, for the header's warning on every page (RULES
 * DV14). Anything but a clear answer reads as off: the header is a reminder,
 * and a reminder that breaks the page when the API hiccups is worse than none.
 */
export async function GET() {
  const result = await adminTry<MaintenanceFlag>('/admin/maintenance/flag');
  const flag: MaintenanceFlag = 'data' in result ? result.data : { enabled: false, startedAt: null, endsAt: null };
  return Response.json(flag, { headers: { 'cache-control': 'no-store' } });
}
