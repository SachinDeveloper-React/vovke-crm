import { redirect } from 'next/navigation';

import { paths } from '@/src/layout/paths';

/**
 * There is no front page: the panel is the dashboard.
 *
 * The redirect does not look at the cookie — the dashboard's own read does
 * that, and sends an operator with no key to sign in. Checking it twice would
 * mean reading cookies here too, which would make this page dynamic for no
 * answer it can give.
 */
export default function Page() {
  redirect(paths.dashboard.analytics);
}
