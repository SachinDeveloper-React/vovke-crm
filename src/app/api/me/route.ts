import { currentStaff } from '@/src/lib/api';

/**
 * Who is signed in, for the browser's own drawing — which menu items to
 * show, whose name goes in the header (RULES Z9). Display only: every page
 * and every action is checked by the API itself, whatever this says.
 */
export async function GET() {
  const me = await currentStaff();
  if (!me) return Response.json({ error: 'Not signed in.' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  return Response.json(me, { headers: { 'cache-control': 'no-store' } });
}
