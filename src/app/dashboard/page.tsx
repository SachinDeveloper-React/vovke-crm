import { redirect } from 'next/navigation';

import { paths } from '@/src/layout/paths';

export default function Page() {
  redirect(paths.dashboard.analytics);
}
